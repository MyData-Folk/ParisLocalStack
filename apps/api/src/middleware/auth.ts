import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { config } from "../config.js";
import { prisma } from "../database/prisma.js";

type JwtPayload = {
  sub: string;
};

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { hotels: true }
    });
    if (!user) return res.status(401).json({ error: "Invalid token" });
    if (user.status !== "active") return res.status(403).json({ error: "Account disabled" });

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      hotelIds: user.hotels.map((hotelUser) => hotelUser.hotelId)
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Missing user" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}

export function canAccessHotel(user: Express.Request["user"], hotelId: string) {
  return Boolean(user && (user.role === "super_admin" || user.hotelIds.includes(hotelId)));
}

export function requireHotelAccess(paramName = "hotelId") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Missing user" });
    const hotelId = req.params[paramName] ?? req.body.hotelId;
    if (!hotelId || !canAccessHotel(req.user, hotelId)) {
      return res.status(403).json({ error: "Hotel access denied" });
    }
    return next();
  };
}
