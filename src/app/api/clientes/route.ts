// app/api/clientes/route.ts
// GET  /api/clientes          — Lista clientes activos
// POST /api/clientes          — Registra un cliente nuevo
// PUT  /api/clientes          — Actualiza datos de un cliente
// DELETE /api/clientes?id=xxx — Elimina cliente (borrado lógico)

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * GET /api/clientes
 * Retorna todos los clientes activos.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const clientes = await prisma.cliente.findMany({
      where: { deleted: false },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json({ clientes });
  } catch (error) {
    console.error("[GET /api/clientes]", error);
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 });
  }
}

/**
 * POST /api/clientes
 * Registra un nuevo cliente en el sistema.
 * Body: {
 *   nombre:          string   // Obligatorio
 *   telefono?:       string
 *   email?:          string
 *   direccion?:      string   // Para domicilios
 *   puntoReferencia?: string  // Máx 100 caracteres
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { nombre, telefono, email, direccion, puntoReferencia } = await request.json();

  if (!nombre?.trim()) {
    return NextResponse.json({ error: "El nombre del cliente es obligatorio" }, { status: 400 });
  }

  if (puntoReferencia && puntoReferencia.length > 100) {
    return NextResponse.json(
      { error: "El punto de referencia no puede superar 100 caracteres" },
      { status: 400 }
    );
  }

  try {
    const cliente = await prisma.cliente.create({
      data: {
        nombre:          nombre.trim(),
        telefono:        telefono?.trim()        || null,
        email:           email?.trim()           || null,
        direccion:       direccion?.trim()       || null,
        puntoReferencia: puntoReferencia?.trim() || null,
      },
    });
    return NextResponse.json({ cliente }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clientes]", error);
    return NextResponse.json({ error: "Error al registrar cliente" }, { status: 500 });
  }
}

/**
 * PUT /api/clientes
 * Actualiza los datos de un cliente existente.
 * Body: { id, nombre?, telefono?, email?, direccion?, puntoReferencia? }
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id, nombre, telefono, email, direccion, puntoReferencia } = await request.json();

  if (!id) return NextResponse.json({ error: "Se requiere el ID del cliente" }, { status: 400 });

  if (puntoReferencia && puntoReferencia.length > 100) {
    return NextResponse.json(
      { error: "El punto de referencia no puede superar 100 caracteres" },
      { status: 400 }
    );
  }

  try {
    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        ...(nombre          !== undefined && { nombre:          nombre.trim()          }),
        ...(telefono        !== undefined && { telefono:        telefono?.trim()       || null }),
        ...(email           !== undefined && { email:           email?.trim()          || null }),
        ...(direccion       !== undefined && { direccion:       direccion?.trim()      || null }),
        ...(puntoReferencia !== undefined && { puntoReferencia: puntoReferencia?.trim()|| null }),
      },
    });
    return NextResponse.json({ cliente });
  } catch (error) {
    console.error("[PUT /api/clientes]", error);
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
  }
}

/**
 * DELETE /api/clientes?id=xxx
 * Borrado lógico: marca el cliente como deleted=true.
 * Los pedidos históricos del cliente se conservan.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo ADMIN puede eliminar clientes" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Se requiere el ID" }, { status: 400 });

  try {
    await prisma.cliente.update({ where: { id }, data: { deleted: true } });
    return NextResponse.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("[DELETE /api/clientes]", error);
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 });
  }
}