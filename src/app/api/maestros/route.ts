// app/api/maestros/route.ts
// GET  /api/maestros — Lista maestros (ADMIN y USER)
// POST /api/maestros — Crea maestro (solo ADMIN)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const maestros = await prisma.maestro.findMany({
      where: { deleted: false },
      select: {
        id: true, nombre: true, unidad: true, saldo: true, createdAt: true,
        creadoPor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json({ maestros });
  } catch (error) {
    console.error("[GET /api/maestros]", error);
    return NextResponse.json({ error: "Error al obtener maestros" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Solo ADMIN puede crear maestros" }, { status: 403 });

  const { nombre, unidad, saldoInicial } = await request.json();

  if (!nombre || !unidad || saldoInicial === undefined) {
    return NextResponse.json({ error: "Nombre, unidad y saldoInicial son obligatorios" }, { status: 400 });
  }

  try {
    const maestro = await prisma.maestro.create({
      data: { nombre, unidad, saldo: Number(saldoInicial), creadoPorId: session.id },
      include: { creadoPor: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ maestro }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/maestros]", error);
    return NextResponse.json({ error: "Error al crear maestro" }, { status: 500 });
  }
}
