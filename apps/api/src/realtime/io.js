import { Server } from "socket.io";

import { env } from "../config/env.js";
import { doctorRoom, setIo, tokenRoom } from "./queueEvents.js";

/**
 * Read-only broadcast channel. Clients may subscribe to a doctor board or their
 * own token; every mutation still goes through the authenticated REST API, so a
 * socket can never change state.
 */
export function attachRealtime(httpServer) {
  const io = new Server(httpServer, {
    // Mirrors the HTTP CORS policy: strict in production, permissive for local
    // and preview hosts in development.
    cors: { origin: env.isProd ? env.corsOrigins : true, credentials: true },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    socket.on("subscribe:doctor", (doctorId) => {
      if (typeof doctorId === "string" && doctorId) void socket.join(doctorRoom(doctorId));
    });
    socket.on("unsubscribe:doctor", (doctorId) => {
      if (typeof doctorId === "string" && doctorId) void socket.leave(doctorRoom(doctorId));
    });
    socket.on("subscribe:token", (tokenId) => {
      if (typeof tokenId === "string" && tokenId) void socket.join(tokenRoom(tokenId));
    });
  });

  setIo(io);
  return io;
}
