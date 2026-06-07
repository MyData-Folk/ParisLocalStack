import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema, changePasswordSchema } from "@paris-local/shared";
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
  if (user.status !== "active") return res.status(403).json({ error: "Account disabled" });

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
      status: user.status,
      hotelIds: user.hotels.map((hotelUser) => hotelUser.hotelId)
    }
  });
}));

authRouter.patch("/me/password", authenticate, validateBody(changePasswordSchema), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(401).json({ error: "Invalid token" });

  const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

  const hash = await bcrypt.hash(req.body.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });

  return sendOk(res, { passwordChanged: true });
}));

authRouter.post("/logout", authenticate, (_req, res) => sendOk(res, { ok: true }));
authRouter.get("/me", authenticate, (req, res) => sendOk(res, req.user));
