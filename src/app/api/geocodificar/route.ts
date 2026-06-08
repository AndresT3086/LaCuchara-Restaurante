// app/api/geocodificar/route.ts
// POST /api/geocodificar — Convierte dirección colombiana en lat/lng
// Usa Google Maps Geocoding API — funciona con nomenclatura urbana colombiana
// incluyendo "Carrera 34A #75 sur 50, Sabaneta"

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { direccion } = await request.json();

  if (!direccion?.trim()) {
    return NextResponse.json({ error: "La dirección es obligatoria" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Servicio de geocodificación no configurado" },
      { status: 500 }
    );
  }

  // Si la dirección no menciona Colombia ni un municipio conocido, agregamos contexto
  const yaTieneContexto = /colombia|sabaneta|envigado|medell|itagü|bello|antioquia/i.test(direccion);
  const query = yaTieneContexto ? direccion.trim() : `${direccion.trim()}, Sabaneta, Antioquia, Colombia`;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address",    query);
    url.searchParams.set("region",     "co");       // Sesgar resultados hacia Colombia
    url.searchParams.set("language",   "es");
    url.searchParams.set("key",        apiKey);

    const res  = await fetch(url.toString());
    const data = await res.json();

    // Google retorna ZERO_RESULTS cuando no encuentra la dirección
    if (data.status === "ZERO_RESULTS" || !data.results?.length) {
      return NextResponse.json(
        {
          encontrado: false,
          error:      "No encontramos esa dirección. Intenta agregar el municipio, por ejemplo: 'Carrera 34A #75 sur 50, Sabaneta'",
        },
        { status: 404 }
      );
    }

    if (data.status !== "OK") {
      console.error("[geocodificar] Google API error:", data.status, data.error_message);
      return NextResponse.json(
        { error: "Error al consultar el servicio de ubicación. Intenta de nuevo." },
        { status: 500 }
      );
    }

    const resultado    = data.results[0];
    const { lat, lng } = resultado.geometry.location;

    // Construir dirección normalizada legible desde los componentes de Google
    const componentes  = resultado.address_components as {
      long_name: string;
      short_name: string;
      types: string[];
    }[];

    const obtener = (tipo: string) =>
      componentes.find((c) => c.types.includes(tipo))?.long_name ?? "";

    const calle      = obtener("route");
    const numero     = obtener("street_number");
    const barrio     = obtener("neighborhood") || obtener("sublocality_level_1");
    const ciudad     = obtener("locality") || obtener("administrative_area_level_2");
    const depto      = obtener("administrative_area_level_1");

    const partes = [
      calle && numero ? `${calle} ${numero}` : calle || numero,
      barrio,
      ciudad,
      depto,
    ].filter(Boolean);

    const direccionNormalizada = partes.length >= 2
      ? partes.join(", ")
      : resultado.formatted_address;

    return NextResponse.json({
      encontrado:            true,
      lat,
      lng,
      direccion_normalizada: direccionNormalizada,
      direccion_completa:    resultado.formatted_address,
    });

  } catch (error) {
    console.error("[POST /api/geocodificar]", error);
    return NextResponse.json(
      { error: "Error al verificar la dirección. Intenta de nuevo." },
      { status: 500 }
    );
  }
}