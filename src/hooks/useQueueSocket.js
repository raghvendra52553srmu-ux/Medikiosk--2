import { useEffect } from "react";
import { io, } from "socket.io-client";

/**
 * Live queue updates.
 *
 * The socket is read-only: it carries "something changed" notifications, and the
 * component re-fetches through the normal authenticated REST endpoint. That
 * keeps a single source of truth for authorisation — a socket can never mutate
 * or leak data on its own.
 */

const URL = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL?.replace(/\/api$/, "") ?? undefined;

let shared = null;

function getSocket() {
  if (!shared) {
    shared = io(URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });
  }
  return shared;
}

/** Subscribe a doctor's board. `onChange` fires when any token on it moves. */
export function useDoctorQueueSocket(doctorId, onChange) {
  useEffect(() => {
    if (!doctorId) return;
    const socket = getSocket();

    const handler = () => onChange();
    socket.emit("subscribe:doctor", doctorId);
    socket.on("queue:changed", handler);
    // A reconnect may have missed events — resync on rejoin.
    socket.on("connect", () => {
      socket.emit("subscribe:doctor", doctorId);
      onChange();
    });

    return () => {
      socket.emit("unsubscribe:doctor", doctorId);
      socket.off("queue:changed", handler);
    };
  }, [doctorId, onChange]);
}

/** Subscribe one patient's own token, for the live "your turn" screen. */
export function useTokenSocket(tokenId, onChange) {
  useEffect(() => {
    if (!tokenId) return;
    const socket = getSocket();

    const handler = () => onChange();
    socket.emit("subscribe:token", tokenId);
    socket.on("token:changed", handler);
    socket.on("connect", () => {
      socket.emit("subscribe:token", tokenId);
      onChange();
    });

    return () => {
      socket.off("token:changed", handler);
    };
  }, [tokenId, onChange]);
}
