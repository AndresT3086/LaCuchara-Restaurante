// app/api/categorias/route.ts
// GET  /api/categorias — Lista categorías del menú
// POST /api/categorias — Crea categoría (solo ADMIN)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const categorias = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } });
    return NextResponse.json({ categorias });
  } catch (error) {
    console.error("[GET /api/categorias]", error);
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Solo ADMIN" }, { status: 403 });

  const { nombre, descripcion } = await request.json();
  if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  try {
    const categoria = await prisma.categoria.create({ data: { nombre, descripcion: descripcion ?? null } });
    return NextResponse.json({ categoria }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique")) return NextResponse.json({ error: `Ya existe la categoría "${nombre}"` }, { status: 409 });
    console.error("[POST /api/categorias]", error);
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}
