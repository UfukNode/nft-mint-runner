export type MintState =
  | "IDLE"
  | "INSPECTING"
  | "CONFIGURING"
  | "VALIDATING"
  | "READY"
  | "PREPARING"
  | "PREPARED"
  | "ARMED"
  | "WAITING"
  | "BROADCASTING"
  | "CONFIRMING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

const transitions: Record<MintState, MintState[]> = {
  IDLE: ["INSPECTING", "CONFIGURING", "CANCELLED"],
  INSPECTING: ["CONFIGURING", "FAILED", "IDLE"],
  CONFIGURING: ["VALIDATING", "INSPECTING", "CANCELLED"],
  VALIDATING: ["READY", "CONFIGURING", "FAILED"],
  READY: ["PREPARING", "CONFIGURING", "CANCELLED"],
  PREPARING: ["PREPARED", "FAILED", "CANCELLED"],
  PREPARED: ["ARMED", "CONFIGURING", "CANCELLED"],
  ARMED: ["WAITING", "BROADCASTING", "CANCELLED"],
  WAITING: ["BROADCASTING", "CANCELLED", "FAILED"],
  BROADCASTING: ["CONFIRMING", "FAILED"],
  CONFIRMING: ["COMPLETED", "FAILED"],
  COMPLETED: ["IDLE"],
  FAILED: ["CONFIGURING", "IDLE"],
  CANCELLED: ["CONFIGURING", "IDLE"]
};

export function nextState(current: MintState, next: MintState): MintState {
  if (!transitions[current].includes(next)) {
    throw new Error(`Invalid mint state transition: ${current} -> ${next}`);
  }
  return next;
}
