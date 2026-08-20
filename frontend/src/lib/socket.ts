import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:4000";

    socket = io(`${backendUrl}/ws`, {
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("🔌 Connected to ARJUNA LMS WebSocket Gateway:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from WebSocket:", reason);
    });

    socket.on("connect_error", (error) => {
      console.warn("🔌 WebSocket connection error:", error.message);
    });
  }

  return socket;
}
