// app/api/pedidos/route.ts
// Restaurante "La Cuchara" — Domicilio o recogida en punto
// Horario de atención: Lunes a Sábado, 11:00 a.m. – 7:00 p.m. (hora Colombia)
//
// GET  /api/pedidos  — Lista pedidos
// POST /api/pedidos  — Crea pedido (domicilio o recogida)
// PUT  /api/pedidos  — Actualiza estado

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// ─── Horario de atención ──────────────────────────────────────────────────────

const HORA_APERTURA  = 11; // 11:00 a.m.
const HORA_CIERRE    = 19; // 7:00 p.m.
// 0=Domingo, 1=Lunes, ..., 6=Sábado
const DIAS_ATENCION  = [1, 2, 3, 4, 5, 6]; // Lunes a Sábado

/**
 * Verifica si el restaurante está abierto en este momento.
 * Usa la zona horaria de Colombia (America/Bogota, UTC-5).
 */
function estaAbierto(): { abierto: boolean; mensaje: string } {
  const ahora     = new Date();
  // Convertir a hora Colombia
  const enColombia = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const dia        = enColombia.getDay();  // 0=Dom ... 6=Sab
  const hora       = enColombia.getHours();
  const minutos    = enColombia.getMinutes();

  const diasNombre = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  if (!DIAS_ATENCION.includes(dia)) {
    return {
      abierto: false,
      mensaje: `Lo sentimos, hoy es ${diasNombre[dia]} y no atendemos. Nuestro horario es lunes a sábado de 11:00 a.m. a 7:00 p.m.`,
    };
  }

  const horaActual = hora + minutos / 60;
  if (horaActual < HORA_APERTURA) {
    return {
      abierto: false,
      mensaje: `Aún no hemos abierto. Atendemos de 11:00 a.m. a 7:00 p.m.`,
    };
  }

  if (horaActual >= HORA_CIERRE) {
    return {
      abierto: false,
      mensaje: `Ya cerramos por hoy. Atendemos lunes a sábado de 11:00 a.m. a 7:00 p.m.`,
    };
  }

  return { abierto: true, mensaje: "Abierto" };
}

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
  if (distKm <= TARIFA_PLANA_KM)     return { costo: TARIFA_PLANA_VALOR,                cobertura: true  };
  if (distKm <= COBERTURA_MAXIMA_KM) return { costo: Math.ceil(distKm) * TARIFA_POR_KM, cobertura: true  };
  return                                     { costo: 0,                                 cobertura: false };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const estado      = searchParams.get("estado");
  const tipoEntrega = searchParams.get("tipoEntrega");

  try {
    // CLIENTE solo puede ver sus propios pedidos
    let clienteIdFiltro: string | undefined;
    if (session.role === "CLIENTE") {
      const clientePropio = await prisma.cliente.findFirst({
        where: { email: session.email, deleted: false },
        select: { id: true },
      });
      if (!clientePropio) return NextResponse.json({ pedidos: [] });
      clienteIdFiltro = clientePropio.id;
    }

    const pedidos = await prisma.pedido.findMany({
      where: {
        deleted: false,
        ...(clienteIdFiltro ? { clienteId: clienteIdFiltro }      : {}),
        ...(estado           ? { estado:      estado      as never } : {}),
        ...(tipoEntrega      ? { tipoEntrega: tipoEntrega as never } : {}),
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
 *   clienteId:      string              // Siempre obligatorio
 *   tipoEntrega:    "DOMICILIO"|"RECOGIDA"  // Obligatorio
 *   items:          [{ platoId, cantidad }] // Obligatorio
 *
 *   // Solo requeridos si tipoEntrega === "DOMICILIO":
 *   latCliente?:    number
 *   lngCliente?:    number
 *
 *   nota?:          string
 *   observaciones?: string   // máx 200 caracteres
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // ── Verificar horario de atención ───────────────────────────────────────────
  const horario = estaAbierto();
  if (!horario.abierto) {
    return NextResponse.json(
      { error: horario.mensaje },
      { status: 503 } // 503 Service Unavailable: fuera de horario
    );
  }

  const body = await request.json();
  const { clienteId, tipoEntrega, items, nota, observaciones, latCliente, lngCliente } = body;

  // ── Validaciones generales ──────────────────────────────────────────────────

  if (!clienteId) {
    return NextResponse.json(
      { error: "Se requiere el cliente. Todo pedido debe tener un cliente registrado." },
      { status: 400 }
    );
  }

  if (!tipoEntrega || !["DOMICILIO", "RECOGIDA"].includes(tipoEntrega)) {
    return NextResponse.json(
      { error: "tipoEntrega debe ser DOMICILIO o RECOGIDA" },
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

  // ── Calcular costo de envío ─────────────────────────────────────────────────
  // Solo aplica para domicilio. Recogida siempre es $0.

  let costoEnvio  = 0;
  let distanciaKm = 0;

  if (tipoEntrega === "DOMICILIO") {
    if (latCliente === undefined || lngCliente === undefined) {
      return NextResponse.json(
        { error: "Para domicilio se requieren las coordenadas del cliente (latCliente y lngCliente)." },
        { status: 400 }
      );
    }

    distanciaKm   = haversineKm(RESTAURANTE_LAT, RESTAURANTE_LNG, latCliente, lngCliente);
    const envio   = calcularEnvio(distanciaKm);

    if (!envio.cobertura) {
      return NextResponse.json(
        {
          error: `Sin cobertura de domicilio. La dirección está a ${distanciaKm.toFixed(1)} km del restaurante. Solo hacemos domicilios hasta ${COBERTURA_MAXIMA_KM} km. Puedes elegir recoger en el punto sin costo de envío.`,
          distancia_km:        parseFloat(distanciaKm.toFixed(2)),
          cobertura_maxima_km: COBERTURA_MAXIMA_KM,
          sugerencia:          "RECOGIDA",
        },
        { status: 422 }
      );
    }

    costoEnvio = envio.costo;
  }

  // ── Crear pedido en BD ──────────────────────────────────────────────────────

  try {
    const pedido = await prisma.$transaction(async (tx) => {
      // Verificar que el cliente existe
      const cliente = await tx.cliente.findUnique({ where: { id: clienteId } });
      if (!cliente || cliente.deleted) throw new Error("Cliente no encontrado");

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

      let subtotal = 0;
      for (const item of items) {
        subtotal += (precioMap.get(item.platoId) ?? 0) * item.cantidad;
      }

      const total = subtotal + costoEnvio;

      return tx.pedido.create({
        data: {
          clienteId,
          atendidoPorId: session.id,
          tipoEntrega,
          subtotal,
          total,
          costoEnvio,
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
        entrega: {
          tipo:         tipoEntrega,
          costo_envio:  costoEnvio,
          distancia_km: tipoEntrega === "DOMICILIO" ? parseFloat(distanciaKm.toFixed(2)) : null,
          mensaje:      tipoEntrega === "RECOGIDA"
            ? "El cliente recoge en el punto. Sin costo de envío."
            : distanciaKm <= TARIFA_PLANA_KM
              ? `Domicilio zona cercana (${distanciaKm.toFixed(1)} km) — $${costoEnvio.toLocaleString("es-CO")}`
              : `Domicilio a ${distanciaKm.toFixed(1)} km — $${costoEnvio.toLocaleString("es-CO")}`,
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
        atendidoPor: { select: { id: true, name: true }  },
      },
    });
    return NextResponse.json({ pedido });
  } catch (error) {
    console.error("[PUT /api/pedidos]", error);
    return NextResponse.json({ error: "Error al actualizar pedido" }, { status: 500 });
  }
}