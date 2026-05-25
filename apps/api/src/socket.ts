import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { isAllowedOrigin } from "./config.js";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin));
      },
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("hotel:join", (hotelId: string) => {
      socket.join(`hotel:${hotelId}`);
    });

    socket.on("hotel:leave", (hotelId: string) => {
      socket.leave(`hotel:${hotelId}`);
    });
  });

  return io;
}
