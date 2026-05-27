import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { config, isAllowedOrigin } from "./config.js";
import { prisma } from "./database/prisma.js";

type JwtPayload = {
  sub: string;
};

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin));
      },
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const auth = socket.handshake.auth || {};
      const headers = socket.handshake.headers || {};
      
      // 1. Staff Path
      let token = auth.token;
      if (!token && typeof headers.authorization === "string" && headers.authorization.startsWith("Bearer ")) {
        token = headers.authorization.slice(7);
      }

      if (token) {
        try {
          const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
          const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            include: { hotels: true }
          });

          if (!user || user.status !== "active") {
            return next(new Error("unauthorized"));
          }

          const allowedRoles = ["super_admin", "hotel_admin", "receptionist"];
          if (!allowedRoles.includes(user.role)) {
            return next(new Error("unauthorized"));
          }

          socket.data.user = {
            id: user.id,
            role: user.role,
            hotelIds: user.hotels.map((h) => h.hotelId)
          };
          return next();
        } catch {
          return next(new Error("unauthorized"));
        }
      }

      // 2. Guest Path
      const { guestId, stayId, hotelId } = auth;
      if (guestId && stayId && hotelId) {
        const stay = await prisma.stay.findFirst({
          where: {
            id: stayId,
            guestId: guestId,
            hotelId: hotelId,
            status: "active"
          }
        });

        if (!stay) {
          return next(new Error("unauthorized"));
        }

        socket.data.user = {
          role: "guest",
          guestId,
          stayId,
          hotelId
        };
        return next();
      }

      // Neither path matched
      return next(new Error("unauthorized"));
    } catch (err) {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("hotel:join", (hotelId: string) => {
      const user = socket.data.user;
      if (!user) return;

      if (user.role === "guest") {
        // A guest can only join their own hotel's guest room
        if (user.hotelId === hotelId) {
          socket.join(`hotel:guest:${hotelId}`);
        }
      } else {
        // Staff validation
        const hasAccess = user.role === "super_admin" || user.hotelIds.includes(hotelId);
        if (hasAccess) {
          socket.join(`hotel:staff:${hotelId}`);
        }
      }
    });

    socket.on("hotel:leave", (hotelId: string) => {
      const user = socket.data.user;
      if (!user) return;

      if (user.role === "guest") {
        socket.leave(`hotel:guest:${hotelId}`);
      } else {
        socket.leave(`hotel:staff:${hotelId}`);
      }
    });
  });

  return io;
}

