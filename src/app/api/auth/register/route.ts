import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { name, email, password, phone } = await request.json();

  const cleanName     = String(name     ?? "").trim();
  const cleanEmail    = String(email    ?? "").toLowerCase().trim();
  const cleanPassword = String(password ?? "");
  const cleanPhone    = phone ? String(phone).trim() : null;

  if (!cleanName || !cleanEmail || !cleanPassword) {
    return NextResponse.json(
      { error: "Nombre, correo y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  if (cleanPassword.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener mínimo 6 caracteres" },
      { status: 400 }
    );
  }

  try {
    // Verificar si ya existe un usuario con ese correo
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    // Crear el usuario del sistema con rol USER (el único rol válido para registro público)
    const user = await prisma.user.create({
      data: {
        name:     cleanName,
        email:    cleanEmail,
        password: hashedPassword,
        role:     "USER",
      },
      select: { id: true, name: true, email: true, role: true, image: true },
    });

    // Crear también el registro de cliente vinculado a este usuario
    await prisma.cliente.create({
      data: {
        nombre:   cleanName,
        email:    cleanEmail,
        telefono: cleanPhone,
      },
    });

    // Iniciar sesión automáticamente después del registro
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set("session_userId", user.id, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7, // 7 días
      path:     "/",
    });

    return response;
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}