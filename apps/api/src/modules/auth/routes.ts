import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema } from "@paris-local/shared";
import { config } from "../../config.js";
import { prisma } from "../../database/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendOk } from "../../utils/http.js";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { email: req.body.email.toLowerCase() },
    include: { hotels: true }
  });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: "7d" });
  return sendOk(res, {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hotelIds: user.hotels.map((hotelUser) => hotelUser.hotelId)
    }
  });
}));

authRouter.post("/logout", authenticate, (_req, res) => sendOk(res, { ok: true }));
authRouter.get("/me", authenticate, (req, res) => sendOk(res, req.user));
