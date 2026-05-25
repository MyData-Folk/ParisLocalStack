import { io, type Socket } from "socket.io-client";
import { API_URL } from "./api";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      withCredentials: true
    });
  }

  return socket;
}

export function joinHotelRoom(hotelId?: string | null) {
  if (!hotelId) return () => undefined;

  const client = getSocket();
  client.emit("hotel:join", hotelId);

  return () => {
    client.emit("hotel:leave", hotelId);
  };
}
