// app/api/auth/login/route.ts
// POST /api/auth/login — Inicia sesión y retorna la ruta de redirección según rol

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Ruta de destino según el rol del usuario
const REDIRECT_POR_ROL: Record<string, string> = {
  ADMIN:   "/dashboard",
  USER:    "/dashboard",
  CLIENTE: "/pedido",
};

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

    // Determinar a dónde redirigir según el rol
    const redirectTo = REDIRECT_POR_ROL[user.role] ?? "/dashboard";

    const response = NextResponse.json({
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        image: user.image,
      },
      redirectTo, // El frontend usa esto para saber a dónde ir
    });

    response.cookies.set("session_userId", user.id, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });

    return response;
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}