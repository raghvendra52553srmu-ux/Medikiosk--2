/**
 * Thin indirection so domain services can publish without importing the HTTP
 * layer (and so they stay unit-testable with no socket server running).
 */
let io = null;

export const setIo = (server) => {
  io = server;
};

export const doctorRoom = (doctorId) => `doctor:${doctorId}`;
export const tokenRoom = (tokenId) => `token:${tokenId}`;

/** Doctor boards refresh; the affected patient's own screen also updates. */
export function emitQueueChanged(doctorId, payload) {
  if (!io) return;
  io.to(doctorRoom(doctorId)).emit("queue:changed", { doctorId, ...payload, at: Date.now() });
  if (typeof payload.tokenId === "string") {
    io.to(tokenRoom(payload.tokenId)).emit("token:changed", { ...payload, at: Date.now() });
  }
}

/** A new walk-up appeared on the board. */
export function emitTokenIssued(doctorId, payload) {
  if (!io) return;
  io.to(doctorRoom(doctorId)).emit("queue:changed", { doctorId, reason: "issued", ...payload, at: Date.now() });
}
