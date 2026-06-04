// app/api/pedidos/route.ts
// Restaurante "La Cuchara" — Solo domicilios
// Todo pedido requiere cliente y coordenadas de entrega.
//
// GET  /api/pedidos          — Lista pedidos
// POST /api/pedidos          — Crea pedido a domicilio
// PUT  /api/pedidos          — Actualiza estado del pedido

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// ─── Lógica de domicilio ──────────────────────────────────────────────────────

const RESTAURANTE_LAT     =  6.15155;
const RESTAURANTE_LNG     = -75.61657;
const TARIFA_PLANA_KM     = 2;
const TARIFA_PLANA_VALOR  = 7000;
const TARIFA_POR_KM       = 1000;
const COBERTURA_MAXIMA_KM = 5;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcularEnvio(distKm: number): { costo: number; cobertura: boolean } {
  if (distKm <= TARIFA_PLANA_KM)     return { costo: TARIFA_PLANA_VALOR,            cobertura: true  };
  if (distKm <= COBERTURA_MAXIMA_KM) return { costo: Math.ceil(distKm) * TARIFA_POR_KM, cobertura: true  };
  return                                     { costo: 0,                             cobertura: false };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado");

  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        deleted: false,
        ...(estado ? { estado: estado as never } : {}),
      },
      include: {
        cliente: {
          select: {
            id: true, nombre: true, telefono: true,
            direccion: true, puntoReferencia: true,
          },
        },
        atendidoPor: { select: { id: true, name: true } },
        items: {
          include: { plato: { select: { id: true, nombre: true, precio: true } } },
        },
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

// ─── POST ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/pedidos
*
 * Body: {
 *   clienteId:      string    // Obligatorio — el cliente debe existir en la BD
 *   latCliente:     number    // Obligatorio — coordenadas para calcular envío
 *   lngCliente:     number    // Obligatorio
 *   items:          [{ platoId: string, cantidad: number }]
 *   nota?:          string
 *   observaciones?: string    // máx 200 caracteres
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { clienteId, latCliente, lngCliente, items, nota, observaciones } = body;

  // ── Validaciones ────────────────────────────────────────────────────────────

  if (!clienteId) {
    return NextResponse.json(
      { error: "Se requiere el cliente. Todo pedido debe tener un cliente registrado." },
      { status: 400 }
    );
  }

  if (latCliente === undefined || lngCliente === undefined) {
    return NextResponse.json(
      { error: "Se requieren las coordenadas del cliente (latCliente y lngCliente) para calcular el domicilio." },
      { status: 400 }
    );
  }

  if (!items?.length) {
    return NextResponse.json(
      { error: "El pedido debe tener al menos un ítem." },
      { status: 400 }
    );
  }

  if (observaciones && observaciones.length > 200) {
    return NextResponse.json(
      { error: "Las observaciones no pueden superar 200 caracteres." },
      { status: 400 }
    );
  }

  // ── Calcular costo de domicilio ─────────────────────────────────────────────

  const distanciaKm = haversineKm(RESTAURANTE_LAT, RESTAURANTE_LNG, latCliente, lngCliente);
  const envio       = calcularEnvio(distanciaKm);

  if (!envio.cobertura) {
    return NextResponse.json(
      {
        error: `Sin cobertura de domicilio. La dirección está a ${distanciaKm.toFixed(1)} km del restaurante. Solo hacemos domicilios hasta ${COBERTURA_MAXIMA_KM} km.`,
        distancia_km:        parseFloat(distanciaKm.toFixed(2)),
        cobertura_maxima_km: COBERTURA_MAXIMA_KM,
      },
      { status: 422 }
    );
  }

  // ── Crear pedido ────────────────────────────────────────────────────────────

  try {
    const pedido = await prisma.$transaction(async (tx) => {
      // Verificar que el cliente existe
      const cliente = await tx.cliente.findUnique({ where: { id: clienteId } });
      if (!cliente || cliente.deleted) {
        throw new Error("Cliente no encontrado");
      }

      // Obtener precios actuales de los platos
      const platoIds: string[] = items.map((i: { platoId: string }) => i.platoId);
      const platos = await tx.plato.findMany({
        where: { id: { in: platoIds }, deleted: false, disponible: true },
        select: { id: true, precio: true },
      });

      if (platos.length !== platoIds.length) {
        throw new Error("Uno o más platos no están disponibles");
      }

      const precioMap = new Map(platos.map((p) => [p.id, p.precio]));

      // Calcular subtotal (sin envío)
      let subtotal = 0;
      for (const item of items) {
        subtotal += (precioMap.get(item.platoId) ?? 0) * item.cantidad;
      }

      // Total = subtotal + costo de envío
      const total = subtotal + envio.costo;

      return tx.pedido.create({
        data: {
          clienteId,
          atendidoPorId: session.id,
          subtotal,
          total,
          costoEnvio:    envio.costo,
          distanciaKm:   parseFloat(distanciaKm.toFixed(2)),
          nota:          nota          ?? null,
          observaciones: observaciones ?? null,
          items: {
            create: items.map((item: { platoId: string; cantidad: number }) => ({
              platoId:  item.platoId,
              cantidad: item.cantidad,
              precio:   precioMap.get(item.platoId) ?? 0,
            })),
          },
        },
        include: {
          cliente:     { select: { id: true, nombre: true, telefono: true, direccion: true } },
          atendidoPor: { select: { id: true, name: true } },
          items: {
            include: { plato: { select: { id: true, nombre: true } } },
          },
        },
      });
    });

    return NextResponse.json(
      {
        pedido,
        envio: {
          costo:        envio.costo,
          distancia_km: parseFloat(distanciaKm.toFixed(2)),
          mensaje:      distanciaKm <= TARIFA_PLANA_KM
            ? `Envío zona cercana — $${envio.costo.toLocaleString("es-CO")}`
            : `Envío a ${distanciaKm.toFixed(1)} km — $${envio.costo.toLocaleString("es-CO")}`,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    console.error("[POST /api/pedidos]", msg);
    const esBadRequest = ["disponibles", "no encontrado", "Cliente"].some((s) => msg.includes(s));
    return NextResponse.json({ error: msg }, { status: esBadRequest ? 400 : 500 });
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

/**
 * PUT /api/pedidos
 * Actualiza el estado de un pedido.
 * Body: { id: string, estado: Enum_EstadoPedido }
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id, estado } = await request.json();
  if (!id || !estado) {
    return NextResponse.json({ error: "Se requieren id y estado" }, { status: 400 });
  }

  const estadosValidos = ["PENDIENTE", "EN_COCINA", "LISTO", "ENTREGADO", "CANCELADO"];
  if (!estadosValidos.includes(estado)) {
    return NextResponse.json(
      { error: `Estado inválido. Valores permitidos: ${estadosValidos.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const pedido = await prisma.pedido.update({
      where: { id },
      data:  { estado },
      include: {
        cliente:     { select: { id: true, nombre: true } },
        atendidoPor: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ pedido });
  } catch (error) {
    console.error("[PUT /api/pedidos]", error);
    return NextResponse.json({ error: "Error al actualizar pedido" }, { status: 500 });
  }
}