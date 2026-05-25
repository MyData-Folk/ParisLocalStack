import { prisma } from "../database/prisma.js";

export async function validateGuestStayScope(hotelId: string, guestId: string, stayId?: string) {
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, hotelId },
    select: { id: true }
  });
  if (!guest) return false;

  if (!stayId) return true;
  const stay = await prisma.stay.findFirst({
    where: { id: stayId, guestId, hotelId },
    select: { id: true }
  });
  return Boolean(stay);
}

