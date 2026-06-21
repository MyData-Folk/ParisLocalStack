import { Router } from "express";
import bcrypt from "bcryptjs";
import { passwordResetSchema } from "@paris-local/shared";
import { UserRole } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { authenticate, requireHotelAccess, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendOk } from "../../utils/http.js";

export const hotelAdminRouter = Router();

hotelAdminRouter.use(authenticate);

hotelAdminRouter.get(
  "/hotels/:hotelId/receptionists",
  requireRole("super_admin", "hotel_admin"),
  requireHotelAccess("hotelId"),
  asyncHandler(async (req, res) => {
    const receptionists = await prisma.hotelUser.findMany({
      where: {
        hotelId: req.params.hotelId,
        role: UserRole.receptionist,
        user: { role: UserRole.receptionist }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return sendOk(res, receptionists);
  })
);

hotelAdminRouter.patch(
  "/hotels/:hotelId/receptionists/:userId/password",
  requireRole("super_admin", "hotel_admin"),
  requireHotelAccess("hotelId"),
  validateBody(passwordResetSchema),
  asyncHandler(async (req, res) => {
    const membership = await prisma.hotelUser.findUnique({
      where: {
        hotelId_userId: {
          hotelId: req.params.hotelId,
          userId: req.params.userId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            role: true
          }
        }
      }
    });

    if (!membership) return res.status(404).json({ error: "Receptionist not found for this hotel" });

    if (membership.role !== UserRole.receptionist || membership.user.role !== UserRole.receptionist) {
      return res.status(403).json({ error: "Only receptionist users can be managed here" });
    }

    const passwordHash = await bcrypt.hash(req.body.newPassword, 12);
    await prisma.user.update({
      where: { id: membership.user.id },
      data: { passwordHash },
      select: { id: true }
    });

    return sendOk(res, { passwordReset: true });
  })
);
