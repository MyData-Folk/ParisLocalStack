import { io, type Socket } from "socket.io-client";
import { API_URL } from "./api";
import { useAppStore } from "../stores/appStore";

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(authParams?: { guestId?: string; stayId?: string; hotelId?: string }) {
  const token = useAppStore.getState().token;

  // Re-create the socket if the token has changed to force re-authentication
  if (socket && token !== currentToken) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    currentToken = token;
    const auth: Record<string, any> = {};
    if (token) {
      auth.token = token;
    } else if (authParams) {
      Object.assign(auth, authParams);
    }

    socket = io(API_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      withCredentials: true,
      auth
    });
  } else if (authParams) {
    socket.auth = { ...socket.auth, ...authParams };
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
}

export function joinHotelRoom(hotelId?: string | null, authParams?: { guestId?: string; stayId?: string; hotelId?: string }) {
  if (!hotelId) return () => undefined;

  const client = getSocket(authParams);
  client.emit("hotel:join", hotelId);

  return () => {
    client.emit("hotel:leave", hotelId);
  };
}
