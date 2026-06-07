// app/api/domicilio/route.ts
// POST /api/domicilio/calcular — Calcula el costo de envío según distancia
// GET  /api/domicilio/cobertura — Retorna la zona de cobertura del restaurante
//
// El restaurante está ubicado cerca del Parque Principal de Sabaneta, Antioquia.
// Coordenadas: 6.15155, -75.61657
//
// Tarifas:
//   0 - 2 km   → $7.000 COP tarifa plana
//   2 - 5 km   → $1.000 COP por kilómetro
//   > 5 km     → Sin cobertura, no se puede generar el pedido

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// ─── Coordenadas del restaurante ─────────────────────────────────────────────

const RESTAURANTE = {
  nombre:   "La Cuchara — Parque Principal de Sabaneta",
  lat:      6.15155,
  lng:     -75.61657
};

// ─── Tarifas ──────────────────────────────────────────────────────────────────

const TARIFA_PLANA_KM     = 2;      // km: hasta aquí cuesta tarifa fija
const TARIFA_PLANA_VALOR  = 7000;   // COP
const TARIFA_POR_KM       = 1000;   // COP por km entre 2 y 5 km
const COBERTURA_MAXIMA_KM = 5;      // km: más de esto, sin cobertura

// ─── Fórmula de Haversine ─────────────────────────────────────────────────────
// Calcula la distancia en kilómetros entre dos puntos geográficos.

function calcularDistanciaKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Radio de la Tierra en km

  // Convertir grados a radianes
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en km
}

// ─── Calcular costo según distancia ──────────────────────────────────────────

function calcularCostoEnvio(distanciaKm: number): {
  tiene_cobertura: boolean;
  costo:           number;
  distancia_km:    number;
  mensaje:         string;
  rango:           string;
} {
  const dist = Math.round(distanciaKm * 100) / 100; // Redondear a 2 decimales

  if (dist <= TARIFA_PLANA_KM) {
    return {
      tiene_cobertura: true,
      costo:           TARIFA_PLANA_VALOR,
      distancia_km:    dist,
      mensaje:         `Envío dentro de la zona cercana (${dist} km)`,
      rango:           `0 - ${TARIFA_PLANA_KM} km`,
    };
  }

  if (dist <= COBERTURA_MAXIMA_KM) {
    // Entre 2 y 5 km: $1.000 por km (redondeado al km entero hacia arriba)
    const kmCobrados = Math.ceil(dist);
    const costo = kmCobrados * TARIFA_POR_KM;
    return {
      tiene_cobertura: true,
      costo,
      distancia_km:    dist,
      mensaje:         `Envío a ${dist} km — ${kmCobrados} km cobrados`,
      rango:           `${TARIFA_PLANA_KM} - ${COBERTURA_MAXIMA_KM} km`,
    };
  }

  // Más de 5 km: sin cobertura
  return {
    tiene_cobertura: false,
    costo:           0,
    distancia_km:    dist,
    mensaje:         `Lo sentimos, estás a ${dist} km. Solo hacemos domicilios hasta ${COBERTURA_MAXIMA_KM} km del restaurante.`,
    rango:           `> ${COBERTURA_MAXIMA_KM} km`,
  };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * POST /api/domicilio/calcular
 * Recibe las coordenadas del cliente y retorna el costo de envío.
 *
 * Body: {
 *   lat: number   // Latitud del cliente
 *   lng: number   // Longitud del cliente
 * }
 *
 * Respuesta exitosa:
 * {
 *   tiene_cobertura: true,
 *   costo: 7000,
 *   distancia_km: 1.3,
 *   mensaje: "Envío dentro de la zona cercana",
 *   rango: "0 - 2 km",
 *   restaurante: { lat, lng, nombre }
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { lat, lng } = body;

  // Validar que se enviaron coordenadas válidas
  if (lat === undefined || lng === undefined) {
    return NextResponse.json(
      { error: "Se requieren las coordenadas del cliente (lat y lng)" },
      { status: 400 }
    );
  }

  if (
    typeof lat !== "number" || typeof lng !== "number" ||
    lat < -90  || lat > 90  ||
    lng < -180 || lng > 180
  ) {
    return NextResponse.json(
      { error: "Coordenadas inválidas" },
      { status: 400 }
    );
  }

  const distanciaKm = calcularDistanciaKm(
    RESTAURANTE.lat, RESTAURANTE.lng,
    lat, lng
  );

  const resultado = calcularCostoEnvio(distanciaKm);

  return NextResponse.json({
    ...resultado,
    restaurante: RESTAURANTE,
  });
}

/**
 * GET /api/domicilio/cobertura
 * Retorna la información de cobertura y tarifas del restaurante.
 * Útil para mostrar en el frontend antes de pedir coordenadas.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    restaurante: RESTAURANTE,
    tarifas: [
      {
        rango:       `0 - ${TARIFA_PLANA_KM} km`,
        costo:       TARIFA_PLANA_VALOR,
        descripcion: "Tarifa plana para envíos cercanos",
      },
      {
        rango:       `${TARIFA_PLANA_KM} - ${COBERTURA_MAXIMA_KM} km`,
        costo:       `$${TARIFA_POR_KM.toLocaleString("es-CO")} por km`,
        descripcion: "Tarifa por kilómetro",
      },
      {
        rango:       `Más de ${COBERTURA_MAXIMA_KM} km`,
        costo:       null,
        descripcion: "Sin cobertura — no se puede generar el pedido",
      },
    ],
    cobertura_maxima_km: COBERTURA_MAXIMA_KM,
  });
}