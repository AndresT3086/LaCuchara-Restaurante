// app/api/geocodificar/route.ts
// POST /api/geocodificar — Convierte dirección colombiana en coordenadas lat/lng
//
// Nominatim no maneja bien el formato de nomenclatura urbana colombiana
// (Carrera 34A #75 sur 50), así que intentamos varias estrategias:
//
// 1. Búsqueda con la dirección tal como la escribió el usuario + ciudad
// 2. Búsqueda simplificando el formato (quitar el #, sur, bis, etc.)
// 3. Búsqueda solo con el barrio/ciudad si las anteriores fallan

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// ─── Helper: llamar a Nominatim ──────────────────────────────────────────────

async function buscarEnNominatim(query: string): Promise<{
  lat: number;
  lng: number;
  display_name: string;
  address: Record<string, string>;
} | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q",              query);
  url.searchParams.set("format",         "json");
  url.searchParams.set("limit",          "1");
  url.searchParams.set("countrycodes",   "co");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language","es");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent":      "LaCuchara-Restaurante/1.0 (contacto@lacuchara.co)",
      "Accept-Language": "es",
    },
  });

  if (!res.ok) return null;
  const resultados = await res.json();
  if (!resultados?.length) return null;

  return {
    lat:          parseFloat(resultados[0].lat),
    lng:          parseFloat(resultados[0].lon),
    display_name: resultados[0].display_name,
    address:      resultados[0].address ?? {},
  };
}

// ─── Helper: simplificar dirección colombiana ─────────────────────────────────
// Convierte "Carrera 34A #75 sur 50" en algo que Nominatim entienda mejor

function simplificarDireccion(direccion: string): string {
  return direccion
    .replace(/#/g, "")           // quitar #
    .replace(/\s+sur\b/gi, "")   // quitar "sur"
    .replace(/\s+norte\b/gi, "") // quitar "norte"
    .replace(/\s+este\b/gi, "")  // quitar "este"
    .replace(/\s+oeste\b/gi, "") // quitar "oeste"
    .replace(/\s+bis\b/gi, "")   // quitar "bis"
    .replace(/Cra\./gi, "Carrera")
    .replace(/Cll\./gi, "Calle")
    .replace(/Av\./gi, "Avenida")
    .replace(/Dg\./gi, "Diagonal")
    .replace(/Tr\./gi, "Transversal")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Helper: extraer solo el barrio/municipio ─────────────────────────────────
// Si la dirección tiene "Sabaneta" o "El Poblado", extraemos esa parte

function extraerBarrioOCiudad(direccion: string): string | null {
  // Buscar texto después de una coma
  const partes = direccion.split(",").map((p) => p.trim());
  // Tomamos la segunda parte en adelante (barrio, ciudad)
  if (partes.length >= 2) {
    return partes.slice(1).join(", ");
  }
  return null;
}

// ─── Construir dirección normalizada legible ──────────────────────────────────

function construirDireccionNormalizada(
  address: Record<string, string>,
  displayName: string
): string {
  const partes = [
    address.road,
    address.house_number,
    address.neighbourhood || address.suburb || address.quarter,
    address.city || address.town || address.municipality || address.county,
    address.state,
  ].filter(Boolean);

  return partes.length >= 2 ? partes.join(", ") : displayName.split(",").slice(0, 3).join(",");
}

// ─── Endpoint principal ───────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { direccion } = await request.json();

  if (!direccion?.trim()) {
    return NextResponse.json({ error: "La dirección es obligatoria" }, { status: 400 });
  }

  const dir = direccion.trim();

  // Decidir si ya incluye ciudad/municipio o hay que agregarlo
  const yaTieneCiudad = /sabaneta|envigado|medellín|medellin|bello|itagüí|itagui|caldas|la estrella/i.test(dir);
  const sufijo        = yaTieneCiudad ? ", Colombia" : ", Sabaneta, Antioquia, Colombia";

  // ── Estrategia 1: dirección tal cual + ciudad ─────────────────────────────
  let resultado = await buscarEnNominatim(`${dir}${sufijo}`);

  // ── Estrategia 2: dirección simplificada (sin #, sur, etc.) ──────────────
  if (!resultado) {
    const dirSimple = simplificarDireccion(dir);
    if (dirSimple !== dir) {
      resultado = await buscarEnNominatim(`${dirSimple}${sufijo}`);
    }
  }

  // ── Estrategia 3: solo barrio/ciudad extraído de la dirección ─────────────
  if (!resultado) {
    const barrioOCiudad = extraerBarrioOCiudad(dir);
    if (barrioOCiudad) {
      resultado = await buscarEnNominatim(`${barrioOCiudad}, Colombia`);
    }
  }

  // ── Estrategia 4: solo el municipio mencionado ────────────────────────────
  if (!resultado && !yaTieneCiudad) {
    resultado = await buscarEnNominatim("Sabaneta, Antioquia, Colombia");
  }

  // ── Sin resultado después de todas las estrategias ────────────────────────
  if (!resultado) {
    return NextResponse.json(
      {
        encontrado: false,
        error:
          "No pudimos ubicar esa dirección. Intenta escribir el barrio o municipio más claramente, por ejemplo: 'Barrio La Doctora, Sabaneta' o 'El Poblado, Medellín'.",
      },
      { status: 404 }
    );
  }

  const direccionNormalizada = construirDireccionNormalizada(
    resultado.address,
    resultado.display_name
  );

  return NextResponse.json({
    encontrado:            true,
    lat:                   resultado.lat,
    lng:                   resultado.lng,
    direccion_normalizada: direccionNormalizada,
    direccion_completa:    resultado.display_name,
  });
}