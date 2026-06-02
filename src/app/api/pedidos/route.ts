// app/api/pedidos/route.ts
// GET  /api/pedidos          — Lista pedidos con filtros opcionales
// POST /api/pedidos          — Crea pedido con sus ítems
// PUT  /api/pedidos          — Actualiza estado de un pedido

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado");

  try {
    const pedidos = await prisma.pedido.findMany({
      where: { deleted: false, ...(estado ? { estado: estado as never } : {}) },
      include: {
        cliente:     { select: { id: true, nombre: true, telefono: true } },
        atendidoPor: { select: { id: true, name: true } },
        items: { include: { plato: { select: { id: true, nombre: true, precio: true } } } },
        pagos: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ pedidos });
  } catch (error) {
    console.error("[GET /api/pedidos]", error);
    return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { mesa, nota, clienteId, items } = await request.json();
  if (!items?.length) return NextResponse.json({ error: "El pedido debe tener al menos un ítem" }, { status: 400 });

  try {
    const pedido = await prisma.$transaction(async (tx) => {
      const platoIds: string[] = items.map((i: { platoId: string }) => i.platoId);
      const platos = await tx.plato.findMany({
        where: { id: { in: platoIds }, deleted: false, disponible: true },
        select: { id: true, precio: true },
      });
      if (platos.length !== platoIds.length) throw new Error("Uno o más platos no están disponibles");

      const precioMap = new Map(platos.map((p) => [p.id, p.precio]));
      let subtotal = 0;
      for (const item of items) subtotal += (precioMap.get(item.platoId) ?? 0) * item.cantidad;

      return tx.pedido.create({
        data: {
          mesa: mesa ?? null, nota: nota ?? null, subtotal, total: subtotal,
          atendidoPorId: session.id, clienteId: clienteId ?? null,
          items: { create: items.map((item: { platoId: string; cantidad: number }) => ({
            platoId: item.platoId, cantidad: item.cantidad, precio: precioMap.get(item.platoId) ?? 0,
          })) },
        },
        include: { items: { include: { plato: { select: { id: true, nombre: true } } } } },
      });
    });
    return NextResponse.json({ pedido }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: msg.includes("disponibles") ? 400 : 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id, estado } = await request.json();
  if (!id || !estado) return NextResponse.json({ error: "Se requieren id y estado" }, { status: 400 });

  try {
    const pedido = await prisma.pedido.update({ where: { id }, data: { estado } });
    return NextResponse.json({ pedido });
  } catch (error) {
    console.error("[PUT /api/pedidos]", error);
    return NextResponse.json({ error: "Error al actualizar pedido" }, { status: 500 });
  }
}
