// app/api/geocodificar/route.ts
// POST /api/geocodificar — Convierte una dirección de texto en coordenadas lat/lng
// Usa OpenStreetMap Nominatim (gratuito, sin API key)
//
// El cliente escribe su dirección → este endpoint la convierte a lat/lng
// → esas coordenadas se usan para calcular el costo de domicilio

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// Área de búsqueda limitada a Colombia para resultados más precisos
const COLOMBIA_BOUNDS = "-81.7,-4.2,-66.8,13.4"; // lon_min,lat_min,lon_max,lat_max

/**
 * POST /api/geocodificar
 * Convierte una dirección escrita por el cliente en coordenadas.
 *
 * Body: {
 *   direccion: string  // Ej: "Calle 45 #12-30, El Poblado, Medellín"
 * }
 *
 * Respuesta exitosa:
 * {
 *   lat:         6.2087,
 *   lng:        -75.5742,
 *   direccion_normalizada: "Calle 45, El Poblado, Medellín, Antioquia, Colombia",
 *   encontrado:  true
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { direccion } = await request.json();

  if (!direccion?.trim()) {
    return NextResponse.json(
      { error: "La dirección es obligatoria" },
      { status: 400 }
    );
  }

  // Agregamos "Sabaneta Antioquia Colombia" si la dirección no lo incluye
  // para mejorar la precisión de los resultados
  const query = direccion.toLowerCase().includes("colombia")
    ? direccion.trim()
    : `${direccion.trim()}, Sabaneta, Antioquia, Colombia`;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q",              query);
    url.searchParams.set("format",         "json");
    url.searchParams.set("limit",          "1");
    url.searchParams.set("countrycodes",   "co");       // Solo Colombia
    url.searchParams.set("bounded",        "1");
    url.searchParams.set("viewbox",        COLOMBIA_BOUNDS);
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim requiere un User-Agent identificando la aplicación
        "User-Agent": "LaCuchara-Restaurante/1.0 (contacto@lacuchara.co)",
        "Accept-Language": "es",
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim respondió con status ${res.status}`);
    }

    const resultados = await res.json();

    if (!resultados || resultados.length === 0) {
      return NextResponse.json(
        {
          encontrado: false,
          error:      "No encontramos esa dirección. Intenta ser más específico, por ejemplo: 'Carrera 43A #18-12, El Poblado, Medellín'",
        },
        { status: 404 }
      );
    }

    const resultado = resultados[0];
    const lat       = parseFloat(resultado.lat);
    const lng       = parseFloat(resultado.lon);

    // Construir dirección normalizada legible
    const addr     = resultado.address ?? {};
    const partes   = [
      addr.road,
      addr.house_number,
      addr.neighbourhood || addr.suburb,
      addr.city || addr.town || addr.municipality,
      addr.state,
    ].filter(Boolean);

    const direccionNormalizada = partes.length > 0
      ? partes.join(", ")
      : resultado.display_name;

    return NextResponse.json({
      encontrado:            true,
      lat,
      lng,
      direccion_normalizada: direccionNormalizada,
      direccion_completa:    resultado.display_name,
    });

  } catch (error) {
    console.error("[POST /api/geocodificar]", error);
    return NextResponse.json(
      { error: "Error al buscar la dirección. Intenta de nuevo." },
      { status: 500 }
    );
  }
}