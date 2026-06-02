// app/api/user/route.ts
// PUT /api/user — Actualiza rol o estado de un usuario (solo ADMIN)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Crear usuario: solo ADMIN puede crear usuarios del sistema
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { name, email, password, role } = await request.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nombre, email y contraseña son obligatorios" }, { status: 400 });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), password: hash, role: role ?? "USER" },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });
    }
    console.error("[POST /api/user]", error);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { id, role, enabled } = await request.json();
  if (!id) return NextResponse.json({ error: "Se requiere el ID" }, { status: 400 });

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role    !== undefined && { role }),
        ...(enabled !== undefined && { enabled }),
      },
      select: { id: true, name: true, email: true, role: true, enabled: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("[PUT /api/user]", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}
