export function humanNumberToBigInt(humanNumber: string) {
  return BigInt(humanNumber.replaceAll(",", ""));
}