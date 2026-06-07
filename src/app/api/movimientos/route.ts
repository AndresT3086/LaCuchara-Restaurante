// app/api/movimientos/route.ts
// GET  /api/movimientos?maestroId=xxx — Lista movimientos de un maestro + saldos diarios para gráfica
// POST /api/movimientos               — Crea un movimiento y actualiza el saldo del maestro

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const maestroId = searchParams.get("maestroId");
  if (!maestroId) return NextResponse.json({ error: "Se requiere maestroId" }, { status: 400 });

  try {
    const maestro = await prisma.maestro.findUnique({ where: { id: maestroId } });
    if (!maestro) return NextResponse.json({ error: "Maestro no encontrado" }, { status: 404 });

    const movimientos = await prisma.movimiento.findMany({
      where: { maestroId },
      select: {
        id: true, tipo: true, cantidad: true, nota: true, fecha: true,
        responsable: { select: { id: true, name: true, email: true } },
      },
      orderBy: { fecha: "desc" },
    });

    // Calcular saldos diarios acumulados para la gráfica de la página Transacciones
    const saldosDiarios = calcularSaldosDiarios(movimientos, maestro.saldo);

    return NextResponse.json({ movimientos, saldosDiarios, maestro });
  } catch (error) {
    console.error("[GET /api/movimientos]", error);
    return NextResponse.json({ error: "Error al obtener movimientos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role === "CLIENTE") return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { maestroId, tipo, cantidad, nota } = await request.json();

  if (!maestroId || !tipo || cantidad === undefined) {
    return NextResponse.json({ error: "maestroId, tipo y cantidad son obligatorios" }, { status: 400 });
  }
  if (!["ENTRADA", "SALIDA"].includes(tipo)) {
    return NextResponse.json({ error: "tipo debe ser ENTRADA o SALIDA" }, { status: 400 });
  }
  if (Number(cantidad) <= 0) {
    return NextResponse.json({ error: "La cantidad debe ser mayor a 0" }, { status: 400 });
  }

  try {
    // Transacción atómica: o se crea el movimiento Y se actualiza el saldo, o no pasa nada
    const resultado = await prisma.$transaction(async (tx) => {
      const maestro = await tx.maestro.findUnique({ where: { id: maestroId } });
      if (!maestro) throw new Error("Maestro no encontrado");

      const nuevoSaldo =
        tipo === "ENTRADA"
          ? maestro.saldo + Number(cantidad)
          : maestro.saldo - Number(cantidad);

      if (nuevoSaldo < 0) {
        throw new Error(`Saldo insuficiente. Saldo actual: ${maestro.saldo} ${maestro.unidad}`);
      }

      await tx.maestro.update({ where: { id: maestroId }, data: { saldo: nuevoSaldo } });

      const movimiento = await tx.movimiento.create({
        data: { maestroId, tipo, cantidad: Number(cantidad), nota: nota ?? null, responsableId: session.id },
        include: {
          responsable: { select: { id: true, name: true, email: true } },
          maestro: { select: { id: true, nombre: true, saldo: true, unidad: true } },
        },
      });

      return { movimiento, nuevoSaldo };
    });

    return NextResponse.json({ movimiento: resultado.movimiento, nuevoSaldo: resultado.nuevoSaldo }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    const esBadRequest = msg.includes("insuficiente") || msg.includes("no encontrado");
    return NextResponse.json({ error: msg }, { status: esBadRequest ? 400 : 500 });
  }
}

type MovItem = { fecha: Date; tipo: string; cantidad: number };

function calcularSaldosDiarios(movimientos: MovItem[], saldoActual: number) {
  if (!movimientos.length) return [];
  const porDia = new Map<string, number>();
  for (const m of movimientos) {
    const dia = new Date(m.fecha).toISOString().split("T")[0];
    const delta = m.tipo === "ENTRADA" ? m.cantidad : -m.cantidad;
    porDia.set(dia, (porDia.get(dia) ?? 0) + delta);
  }
  const dias = Array.from(porDia.keys()).sort();
  const resultado: { fecha: string; saldo: number }[] = [];
  let acum = saldoActual;
  for (let i = dias.length - 1; i >= 0; i--) {
    resultado.unshift({ fecha: dias[i], saldo: Math.max(0, acum) });
    acum -= porDia.get(dias[i])!;
  }
  return resultado;
}
