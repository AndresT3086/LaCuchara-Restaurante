// app/api/seed/route.ts
// POST /api/seed — Crea usuarios y datos iniciales de prueba
// SOLO usar una vez en desarrollo, después de hacer la migración.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "No disponible en producción" }, { status: 403 });
  }

  try {
    const adminPass = await bcrypt.hash("Admin2026*", 12);
    const userPass  = await bcrypt.hash("User2026*", 12);

    const admin = await prisma.user.upsert({
      where:  { email: "admin@lacuchara.co" },
      update: {},
      create: { name: "Administrador", email: "admin@lacuchara.co", password: adminPass, role: "ADMIN" },
    });

    await prisma.user.upsert({
      where:  { email: "mesero@lacuchara.co" },
      update: {},
      create: { name: "Empleado Demo", email: "mesero@lacuchara.co", password: userPass, role: "USER" },
    });

    const categorias = ["Sopas", "Secos", "Bebidas", "Postres", "Especiales"];
    for (const nombre of categorias) {
      await prisma.categoria.upsert({ where: { nombre }, update: {}, create: { nombre } });
    }

    const maestros = [
      { nombre: "Pollo entero", unidad: "kg", saldo: 10 },
      { nombre: "Arroz",        unidad: "kg", saldo: 25 },
      { nombre: "Fríjoles",     unidad: "kg", saldo: 8  },
      { nombre: "Papa criolla", unidad: "kg", saldo: 20 },
      { nombre: "Maracuyá",     unidad: "kg", saldo: 5  },
    ];
    for (const m of maestros) {
      const existe = await prisma.maestro.findFirst({ where: { nombre: m.nombre } });
      if (!existe) await prisma.maestro.create({ data: { ...m, creadoPorId: admin.id } });
    }

    return NextResponse.json({
      message: "Datos iniciales creados",
      usuarios: [
        { email: "admin@lacuchara.co",  password: "Admin2026*", rol: "ADMIN" },
        { email: "mesero@lacuchara.co", password: "User2026*",  rol: "USER"  },
      ],
    });
  } catch (error) {
    console.error("[POST /api/seed]", error);
    return NextResponse.json({ error: "Error al crear datos iniciales" }, { status: 500 });
  }
}
