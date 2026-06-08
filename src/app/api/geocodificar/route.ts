// app/api/geocodificar/route.ts
// POST /api/geocodificar — Convierte dirección en lat/lng usando Google Maps
// El cliente escribe la dirección con municipio opcional.
// Google determina la ubicación real sin asumir ningún municipio.

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
    console.error("[geocodificar] GOOGLE_MAPS_API_KEY no configurada");
    return NextResponse.json({ error: "Servicio de geocodificación no configurado" }, { status: 500 });
  }

  // Solo agregamos "Antioquia, Colombia" como contexto geográfico mínimo
  // NO forzamos ningún municipio — Google ubica la dirección donde realmente esté
  const dir   = direccion.trim();
  const query = /colombia/i.test(dir) ? dir : `${dir}, Antioquia, Colombia`;

  console.log("[geocodificar] Query:", query);

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address",  query);
    url.searchParams.set("region",   "co");
    url.searchParams.set("language", "es");
    url.searchParams.set("key",      apiKey);

    const res  = await fetch(url.toString());
    const data = await res.json();

    console.log("[geocodificar] Status:", data.status, "| Resultados:", data.results?.length ?? 0);

    if (data.status === "REQUEST_DENIED") {
      console.error("[geocodificar] Key sin permisos:", data.error_message);
      return NextResponse.json({ error: "Error de configuración del servicio." }, { status: 500 });
    }

    if (data.status === "ZERO_RESULTS" || !data.results?.length) {
      return NextResponse.json(
        {
          encontrado: false,
          error: "No encontramos esa dirección. Intenta ser más específico, por ejemplo: Cra 34A #75 Sur 50, Sabaneta",
        },
        { status: 404 }
      );
    }

    if (data.status !== "OK") {
      return NextResponse.json({ error: "Error al consultar el servicio de ubicación." }, { status: 500 });
    }

    const resultado    = data.results[0];
    const { lat, lng } = resultado.geometry.location;

    // Construir dirección normalizada desde los componentes de Google
    const componentes = resultado.address_components as { long_name: string; types: string[] }[];
    const obtener     = (tipo: string) => componentes.find((c) => c.types.includes(tipo))?.long_name ?? "";

    const calle   = obtener("route");
    const numero  = obtener("street_number");
    const barrio  = obtener("neighborhood") || obtener("sublocality_level_1");
    const ciudad  = obtener("locality") || obtener("administrative_area_level_2");
    const depto   = obtener("administrative_area_level_1");

    const partes = [
      calle && numero ? `${calle} ${numero}` : calle || numero,
      barrio,
      ciudad,
      depto,
    ].filter(Boolean);

    const direccionNormalizada = partes.length >= 2
      ? partes.join(", ")
      : resultado.formatted_address;

    console.log("[geocodificar] Encontrado en:", ciudad || depto, "| lat:", lat, "lng:", lng);

    return NextResponse.json({
      encontrado:            true,
      lat,
      lng,
      direccion_normalizada: direccionNormalizada,
      direccion_completa:    resultado.formatted_address,
      municipio:             ciudad || depto, // útil para debug
    });

  } catch (error) {
    console.error("[geocodificar]", error);
    return NextResponse.json({ error: "Error al verificar la dirección. Intenta de nuevo." }, { status: 500 });
  }
}