import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "./config.js";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true }
  });

  io.on("connection", (socket) => {
    socket.on("hotel:join", (hotelId: string) => {
      socket.join(`hotel:${hotelId}`);
    });
  });

  return io;
}
