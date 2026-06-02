// app/api/platos/route.ts
// GET    /api/platos         — Lista platos activos con su categoría
// POST   /api/platos         — Crea un plato (ADMIN y USER)
// PUT    /api/platos         — Actualiza un plato
// DELETE /api/platos?id=xxx  — Elimina (borrado lógico)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const platos = await prisma.plato.findMany({
      where: { deleted: false },
      include: {
        categoria: { select: { id: true, nombre: true } },
        creadoPor: { select: { id: true, name: true } },
      },
      orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
    });
    return NextResponse.json({ platos });
  } catch (error) {
    console.error("[GET /api/platos]", error);
    return NextResponse.json({ error: "Error al obtener platos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { nombre, descripcion, precio, categoriaId, disponible } = await request.json();
  if (!nombre || !descripcion || precio === undefined || !categoriaId) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  try {
    const plato = await prisma.plato.create({
      data: { nombre, descripcion, precio: Number(precio), categoriaId, creadoPorId: session.id, disponible: disponible ?? true },
      include: { categoria: { select: { id: true, nombre: true } } },
    });
    return NextResponse.json({ plato }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/platos]", error);
    return NextResponse.json({ error: "Error al crear plato" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id, nombre, descripcion, precio, disponible, categoriaId } = await request.json();
  if (!id) return NextResponse.json({ error: "Se requiere el ID" }, { status: 400 });

  try {
    const plato = await prisma.plato.update({
      where: { id },
      data: {
        ...(nombre      !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precio      !== undefined && { precio: Number(precio) }),
        ...(disponible  !== undefined && { disponible }),
        ...(categoriaId !== undefined && { categoriaId }),
      },
      include: { categoria: { select: { id: true, nombre: true } } },
    });
    return NextResponse.json({ plato });
  } catch (error) {
    console.error("[PUT /api/platos]", error);
    return NextResponse.json({ error: "Error al actualizar plato" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Solo ADMIN" }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Se requiere el ID" }, { status: 400 });

  try {
    await prisma.plato.update({ where: { id }, data: { deleted: true, disponible: false } });
    return NextResponse.json({ message: "Plato eliminado" });
  } catch (error) {
    console.error("[DELETE /api/platos]", error);
    return NextResponse.json({ error: "Error al eliminar plato" }, { status: 500 });
  }
}
