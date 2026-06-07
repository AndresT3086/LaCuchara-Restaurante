// app/api/users/route.ts
// GET /api/users — Lista todos los usuarios (solo ADMIN)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      where: { deleted: false, role: { in: ["ADMIN", "USER"] } },
      select: { id: true, name: true, email: true, role: true, image: true, enabled: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}
