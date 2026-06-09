// GET  /api/pagos        — Lista todos los pagos (admin/user)
// POST /api/pagos        — Registra un pago { pedidoId, monto, metodo }

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role === "CLIENTE") return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  try {
    const pagos = await prisma.pago.findMany({
      include: {
        pedido: {
          include: {
            cliente: { select: { id: true, nombre: true, telefono: true } },
            items: { include: { plato: { select: { nombre: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pagos });
  } catch (error) {
    console.error("[GET /api/pagos]", error);
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { pedidoId, monto, metodo } = body;

  if (!pedidoId) return NextResponse.json({ error: "Se requiere pedidoId" }, { status: 400 });
  if (!monto || monto <= 0) return NextResponse.json({ error: "Monto inválido" }, { status: 400 });

  const metodosValidos = ["EFECTIVO", "TARJETA_CREDITO", "TARJETA_DEBITO", "TRANSFERENCIA"];
  if (!metodo || !metodosValidos.includes(metodo)) {
    return NextResponse.json(
      { error: `Método inválido. Opciones: ${metodosValidos.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    if (!pedido || pedido.deleted) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const pago = await prisma.pago.create({
      data: { pedidoId, monto, metodo },
      include: {
        pedido: {
          select: {
            id: true,
            total: true,
            cliente: { select: { nombre: true } },
          },
        },
      },
    });

    return NextResponse.json({ pago }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pagos]", error);
    return NextResponse.json({ error: "Error al registrar pago" }, { status: 500 });
  }
}
