import { Router } from "express";
import bcrypt from "bcryptjs";
import { adminPasswordResetSchema } from "@paris-local/shared";
import { UserRole } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendOk } from "../../utils/http.js";

export const adminRouter = Router();

adminRouter.use(authenticate);

adminRouter.patch(
  "/hotel-admins/:userId/password",
  requireRole("super_admin"),
  validateBody(adminPasswordResetSchema),
  asyncHandler(async (req, res) => {
    const target = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true,
        role: true,
        hotels: { select: { role: true, hotelId: true } }
      }
    });

    if (!target) return res.status(404).json({ error: "User not found" });

    const hasHotelAdminMembership = target.hotels.some((membership) => membership.role === UserRole.hotel_admin);
    if (target.role !== UserRole.hotel_admin || !hasHotelAdminMembership) {
      return res.status(403).json({ error: "Only hotel admin users can be managed here" });
    }

    const passwordHash = await bcrypt.hash(req.body.newPassword, 12);
    await prisma.user.update({
      where: { id: target.id },
      data: { passwordHash },
      select: { id: true }
    });

    return sendOk(res, { passwordReset: true });
  })
);
