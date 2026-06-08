// app/api/geocodificar/route.ts
// POST /api/geocodificar — Convierte dirección colombiana en lat/lng con Google Maps

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
    console.error("[geocodificar] GOOGLE_MAPS_API_KEY no está configurada");
    return NextResponse.json(
      { error: "Servicio de geocodificación no configurado" },
      { status: 500 }
    );
  }

  // Siempre agregamos municipio y país para máxima precisión
  // No confiamos en que el usuario lo incluya
  const dir = direccion.trim();
  const yaTieneMunicipio = /sabaneta|envigado|medell|itagü|itagui|bello|caldas|la estrella|antioquia|colombia/i.test(dir);
  const query = yaTieneMunicipio
    ? `${dir}, Colombia`
    : `${dir}, Sabaneta, Antioquia, Colombia`;

  console.log("[geocodificar] Query enviada a Google:", query);

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address",  query);
    url.searchParams.set("region",   "co");
    url.searchParams.set("language", "es");
    url.searchParams.set("key",      apiKey);

    const res  = await fetch(url.toString());
    const data = await res.json();

    console.log("[geocodificar] Status Google:", data.status, "| Resultados:", data.results?.length ?? 0);

    if (data.status === "REQUEST_DENIED") {
      console.error("[geocodificar] API Key inválida o sin permisos:", data.error_message);
      return NextResponse.json(
        { error: "Error de configuración del servicio. Contacta al administrador." },
        { status: 500 }
      );
    }

    if (data.status === "ZERO_RESULTS" || !data.results?.length) {
      // Intentar con solo municipio como fallback
      console.log("[geocodificar] Sin resultados, intentando fallback con solo municipio");
      const fallbackUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      fallbackUrl.searchParams.set("address",  "Sabaneta, Antioquia, Colombia");
      fallbackUrl.searchParams.set("region",   "co");
      fallbackUrl.searchParams.set("language", "es");
      fallbackUrl.searchParams.set("key",      apiKey);

      const fallbackRes  = await fetch(fallbackUrl.toString());
      const fallbackData = await fallbackRes.json();

      if (fallbackData.status === "OK" && fallbackData.results?.length) {
        // Usamos el centro de Sabaneta como aproximación
        const { lat, lng } = fallbackData.results[0].geometry.location;
        console.log("[geocodificar] Usando centro de Sabaneta como aproximación:", lat, lng);
        return NextResponse.json({
          encontrado:            true,
          lat,
          lng,
          aproximado:            true,
          direccion_normalizada: `${dir}, Sabaneta, Antioquia`,
          direccion_completa:    `${dir}, Sabaneta, Antioquia, Colombia`,
        });
      }

      return NextResponse.json(
        {
          encontrado: false,
          error: "No encontramos esa dirección. Asegúrate de incluir el municipio, por ejemplo: Cra 34A #75 Sur 50, Sabaneta",
        },
        { status: 404 }
      );
    }

    if (data.status !== "OK") {
      console.error("[geocodificar] Google error:", data.status, data.error_message);
      return NextResponse.json(
        { error: "Error al consultar el servicio de ubicación." },
        { status: 500 }
      );
    }

    const resultado    = data.results[0];
    const { lat, lng } = resultado.geometry.location;

    const componentes = resultado.address_components as {
      long_name: string;
      types: string[];
    }[];

    const obtener = (tipo: string) =>
      componentes.find((c) => c.types.includes(tipo))?.long_name ?? "";

    const calle  = obtener("route");
    const numero = obtener("street_number");
    const barrio = obtener("neighborhood") || obtener("sublocality_level_1");
    const ciudad = obtener("locality") || obtener("administrative_area_level_2");

    const partes = [
      calle && numero ? `${calle} ${numero}` : calle || numero,
      barrio,
      ciudad,
    ].filter(Boolean);

    const direccionNormalizada = partes.length >= 2
      ? partes.join(", ")
      : resultado.formatted_address;

    return NextResponse.json({
      encontrado:            true,
      lat,
      lng,
      aproximado:            false,
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