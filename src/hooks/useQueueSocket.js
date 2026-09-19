import { useEffect } from "react";
import { io } from "socket.io-client";
import { getBaseUrl } from "@/services/apiClient";

function getSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const base = getBaseUrl();
  if (base.startsWith("http://") || base.startsWith("https://")) {
    return base.replace(/\/api\/?$/, "");
  }
  return undefined;
}

let shared = null;

function getSocket() {
  if (!shared) {
    const socketUrl = getSocketUrl();
    shared = io(socketUrl, {
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
