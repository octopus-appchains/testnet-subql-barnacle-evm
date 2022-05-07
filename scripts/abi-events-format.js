#!node

const args = process.argv.slice(2);
const fs = require("fs");

const graphTypeMap = {
  uint256: "BigInt",
  uint32: "Int",
  address: "String",
};

const tsTypeMap = {
  uint256: "BigNumber",
  uint32: "number",
  address: "string",
};

function start() {
  if (args.length != 1) {
    return console.error("Failed: wrong args length!!");
  }
  const fileName = args[0];
  const abiName = fileName.split(".")[0];
  const typeSuffix = abiName.slice(0, 1).toUpperCase() + abiName.slice(1);
  console.log("fileName", fileName);

  const abiJson = fs.readFileSync(fileName);
  const abi = JSON.parse(abiJson);
  const events = abi.filter((item) => item.type === "event");

  const handlers = events.map(
    ({ name, inputs }) => `
type ${typeSuffix}${name}Args = [${inputs
      .map((i) => tsTypeMap[i.type])
      .join(", ")}] & { ${inputs
      .map((i) => `${i.name}: ${tsTypeMap[i.type]}`)
      .join("; ")}; };
export async function handle${typeSuffix}${name}(event: FrontierEvmEvent<${typeSuffix}${name}Args>): Promise<void> {
  const data = new ${typeSuffix}${name}(event.transactionHash + "-" + event.logIndex);

  data.contractAddress = event.address;

  ${inputs
    .map(
      (i) =>
        `data.${i.name} = event.args.${i.name}${
          tsTypeMap[i.type] === "BigNumber" ? ".toBigInt()" : ""
        };`
    )
    .join(`\n  `)}

  await data.save();
}
      `
  );
  console.log("handlers", handlers.join("\n"));

  const projectYaml = events.map(
    ({ name, inputs }) => `
    - handler: handle${typeSuffix}${name}
      kind: substrate/FrontierEvmEvent
      filter:
        topics:
          - ${name}(${inputs
      .map((i) => `${i.type}${i.indexed ? " indexed" : ""} ${i.name}`)
      .join(", ")})
      `
  );
  console.log("======project.yaml======\n", projectYaml.join("\n"));

  const graphqlSchema = events.map(
    ({ name, inputs }) => `
type ${typeSuffix}${name} @entity {
  id: ID!
  contractAddress: String!
  ${inputs.map((i) => `${i.name}: ${graphTypeMap[i.type]}`).join("\n  ")}
}`
  );
  console.log("======schema.graphql======\n", graphqlSchema.join("\n"));
}

start();
