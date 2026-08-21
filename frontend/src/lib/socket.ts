import { io, Socket } from "socket.io-client";
import { getApiBaseUrl } from "./api";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const backendUrl = getApiBaseUrl().replace(/\/api\/?$/, "");

    socket = io(`${backendUrl}/ws`, {
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[WebSocket] Connected to ARJUNA LMS Gateway:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WebSocket] Disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.warn("[WebSocket] Connection error:", error.message);
    });
  }

  return socket;
}
