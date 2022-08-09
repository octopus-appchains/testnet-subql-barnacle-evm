export function humanNumberToBigInt(humanNumber: string) {
  return BigInt(humanNumber.replaceAll(",", ""));
}

export function bigIntMin(...args) { return args.reduce((m, e) => e < m ? e : m); }