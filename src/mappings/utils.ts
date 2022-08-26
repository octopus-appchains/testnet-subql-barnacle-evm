export function humanNumberToBigInt(humanNumber: string) {
  return BigInt(humanNumber.replaceAll(",", ""));
}

export function bigIntMin(...args) { return args.reduce((m, e) => e < m ? e : m); }

export function jsonLog(source) {
  const newJson = JSON.stringify(source, (key, value) =>
    typeof value === 'bigint'
      ? value.toString()
      : value // return everything else unchanged
  );
  logger.info(newJson)
}