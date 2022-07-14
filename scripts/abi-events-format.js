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
  return `${typeSuffix}${name.slice(0, 1).toUpperCase() + name.slice(1)}Event`;
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
  const events = abi.filter((item) => item.type === "event");
  const imports = events.map(({ name }) => typeName(name));

  const handlers = events.map(
    ({ name, inputs }) => `
type ${typeName(name)}Args = [${inputs
      .map((i) => tsTypeMap[i.type])
      .join(", ")}] & { ${inputs
      .map((i) => `${i.name}: ${tsTypeMap[i.type]}`)
      .join("; ")}; };
export async function handle${typeName(
      name
    )}(event: FrontierEvmEvent<${typeName(name)}Args>): Promise<void> {
  const data = new ${typeName(
    name
  )}(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

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

  await data.save();
}
      `
  );
  console.log(
    "======imports======\n",
    `import { ${imports.join(", ")} } from "../../types"`
  );
  console.log("======handlers======\n", handlers.join(""));

  const projectYaml = events.map(
    ({ name, inputs }) => `
    - handler: handle${typeName(name)}
      kind: substrate/FrontierEvmEvent
      filter:
        topics:
          - ${name}(${inputs
      .map((i) => `${i.type}${i.indexed ? " indexed" : ""} ${i.name}`)
      .join(", ")})`
  );
  console.log("======project.yaml======\n", projectYaml.join("\n"));

  const graphqlSchema = events.map(
    ({ name, inputs }) => `
type ${typeName(name)} @entity {
  id: ID!
  contractAddress: String!
  ${inputs.map((i) => `${i.name}: ${graphTypeMap[i.type]}`).join("\n  ")}
}`
  );
  console.log("======schema.graphql======\n", graphqlSchema.join("\n"));
}

start();
