// app/api/auth/login/route.ts
// POST /api/auth/login — Inicia sesión con email y contraseña

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "El correo y la contraseña son obligatorios" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.enabled || user.deleted) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const passwordValida = await bcrypt.compare(password, user.password);
    if (!passwordValida) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image },
    });

    // Cookie HTTP-only: el navegador la envía automáticamente, pero JS no puede leerla
    response.cookies.set("session_userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
