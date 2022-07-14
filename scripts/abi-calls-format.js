#!node

const args = process.argv.slice(2);
const fs = require("fs");

const graphTypeMap = {
  string: "String",
  uint256: "BigInt",
  uint32: "Int",
  address: "String",
  bool: "Boolean",
  bytes: "String",
  "string[]": "[String]",
  "uint256[]": "[BigInt]",
  "uint32[]": "[Int]",
  "address[]": "[String]",
  "bool[]": "[Boolean]",
};

const tsTypeMap = {
  string: "string",
  uint256: "BigNumber",
  uint32: "number",
  address: "string",
  bool: "boolean",
  bytes: "string",
  "string[]": "string[]",
  "uint256[]": "BigNumber[]",
  "uint32[]": "number[]",
  "address[]": "string[]",
  "bool[]": "boolean[]",
};

let typeSuffix = "";
function typeName(name) {
  return `${typeSuffix}${name.slice(0, 1).toUpperCase() + name.slice(1)}Call`;
}

function start() {
  if (args.length != 1) {
    return console.error("Failed: wrong args length!!");
  }
  const fileName = args[0];
  const abiName = fileName.split(".")[0];
  typeSuffix = abiName.slice(0, 1).toUpperCase() + abiName.slice(1);
  console.log("fileName", fileName);

  const abiJson = fs.readFileSync(fileName);
  const abi = JSON.parse(abiJson);
  const functions = abi.filter(
    (item) => item.type === "function" && item.stateMutability !== "view"
  );

  const imports = functions.map(({ name }) => typeName(name));

  const handlers = functions.map(({ name, inputs }) => {
    const typeLine =
      inputs.length > 0
        ? `type ${typeName(name)}Args = [${inputs
            .map((i) => tsTypeMap[i.type])
            .join(", ")}] & { ${inputs
            .map((i) => `${i.name}: ${tsTypeMap[i.type]}`)
            .join("; ")}; };`
        : "";
    const typeInner = inputs.length > 0 ? `<${typeName(name)}Args>` : "";
    return `
${typeLine}
export async function handle${typeName(
      name
    )}(event: FrontierEvmCall${typeInner}): Promise<void> {
  const data = new ${typeName(name)}(event.hash);
  data.caller = event.from
  data.contractAddress = event.to;

  ${inputs
    .map(
      (i) =>
        `data.${i.name} = event.args.${i.name}${
          tsTypeMap[i.type] === "BigNumber"
            ? ".toBigInt()"
            : tsTypeMap[i.type] === "[]BigNumber"
            ? ".map(a => a.toBigInt())"
            : ""
        };`
    )
    .join(`\n  `)}
  data.success = event.success

  await data.save();
}
      `;
  });
  console.log(
    "======imports======\n",
    `import { ${imports.join(", ")} } from "../../types"`
  );
  console.log("======handlers======\n", handlers.join(""));

  const projectYaml = functions.map(
    ({ name, inputs }) => `
    - handler: handle${typeName(name)}
      kind: substrate/FrontierEvmCall
      filter:
        function: ${name}(${inputs
      .map((i) => `${i.type}${i.indexed ? " indexed" : ""} ${i.name}`)
      .join(", ")})`
  );
  console.log("======project.yaml======\n", projectYaml.join(""));

  const graphqlSchema = functions.map(
    ({ name, inputs }) => `
type ${typeName(name)} @entity {
  id: ID!
  caller: String!
  contractAddress: String!
  ${inputs.map((i) => `${i.name}: ${graphTypeMap[i.type]}`).join("\n  ")}
  success: Boolean!
}`
  );
  console.log("======schema.graphql======\n", graphqlSchema.join("\n"));
}

start();
