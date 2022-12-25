import { Event } from "@polkadot/types/interfaces";
export function isEraEvent(event: Event) {
  return event.section === "octopusLpos" && ["PlanNewEra", "EraPayout"].includes(event.method);
}

export function isBridgeTransferEventOld(event: Event) {
  return event.section === "octopusAppchain" && ["Locked", "AssetBurned", "NftLocked"].includes(event.method)
}

export function isBridgeTransferEvent(event: Event) {
  return event.section === "octopusBridge" && ["Locked", "Nep141Burned", "NonfungibleLocked"].includes(event.method)
}