"use client";

// Componente: FormularioDireccion
// Reemplaza el campo de texto libre por un formulario estructurado
// que arma la dirección en un formato que Nominatim puede interpretar.
//
// Formato resultante: "Carrera 34, Sabaneta, Antioquia, Colombia"
// (sin numeración de cruce, que Nominatim no entiende)

import { useState } from "react";

interface Props {
  onDireccionVerificada: (params: {
    lat: number;
    lng: number;
    direccionNormalizada: string;
    costoEnvio: number;
    mensajeEnvio: string;
  }) => void;
  onSinCobertura: (direccion: string) => void;
  onLimpiar: () => void;
}

const TIPOS_VIA = [
  "Carrera", "Calle", "Avenida", "Diagonal", "Transversal", "Circular",
];

const MUNICIPIOS = [
  "Sabaneta", "Envigado", "Itagüí", "La Estrella", "Caldas",
  "Medellín", "Bello", "Copacabana", "Girardota",
];

function formatCOP(v: number) {
  return `$${new Intl.NumberFormat("es-CO").format(v)}`;
}

export function FormularioDireccion({ onDireccionVerificada, onSinCobertura, onLimpiar }: Props) {
  const [tipoVia,    setTipoVia]    = useState("Carrera");
  const [numeroVia,  setNumeroVia]  = useState("");
  const [letraVia,   setLetraVia]   = useState("");
  const [municipio,  setMunicipio]  = useState("Sabaneta");
  const [barrio,     setBarrio]     = useState("");
  const [verificando, setVerificando] = useState(false);
  const [error,       setError]       = useState("");
  const [resultado,   setResultado]   = useState<{ direccion: string; costo: number; mensaje: string } | null>(null);
  const [sinCobertura, setSinCobertura] = useState(false);

  // Construye la query para Nominatim a partir de los campos estructurados
  // Usamos solo tipo de vía + número + barrio + municipio (sin numeración de cruce)
  // porque Nominatim no entiende el sistema de nomenclatura colombiana completo
  const construirQuery = () => {
    const via = `${tipoVia} ${numeroVia}${letraVia}`.trim();
    const partes = [via, barrio, municipio, "Antioquia", "Colombia"].filter(Boolean);
    return partes.join(", ");
  };

  // Dirección legible para mostrarle al usuario
  const construirDireccionLegible = () => {
    const via = `${tipoVia} ${numeroVia}${letraVia}`.trim();
    const partes = [via, barrio, municipio].filter(Boolean);
    return partes.join(", ");
  };

  const handleVerificar = async () => {
    if (!numeroVia) { setError("Ingresa el número de la vía."); return; }

    setVerificando(true);
    setError("");
    setResultado(null);
    setSinCobertura(false);
    onLimpiar();

    try {
      const query = construirQuery();

      // 1. Geocodificar
      const geoRes = await fetch("/api/geocodificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direccion: query }),
      });
      const geoData = await geoRes.json();

      if (!geoRes.ok || !geoData.encontrado) {
        setError(geoData.error || "No encontramos esa dirección. Intenta cambiar el municipio o agregar el barrio.");
        return;
      }

      // 2. Calcular costo de envío
      const envioRes = await fetch("/api/domicilio/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: geoData.lat, lng: geoData.lng }),
      });
      const envioData = await envioRes.json();

      const direccionLegible = construirDireccionLegible();

      if (!envioData.tiene_cobertura) {
        setSinCobertura(true);
        onSinCobertura(direccionLegible);
        return;
      }

      setResultado({
        direccion: geoData.direccion_normalizada || direccionLegible,
        costo:     envioData.costo,
        mensaje:   envioData.mensaje,
      });

      onDireccionVerificada({
        lat:                  geoData.lat,
        lng:                  geoData.lng,
        direccionNormalizada: geoData.direccion_normalizada || direccionLegible,
        costoEnvio:           envioData.costo,
        mensajeEnvio:         envioData.mensaje,
      });
    } catch {
      setError("Error al verificar la dirección. Intenta de nuevo.");
    } finally {
      setVerificando(false);
    }
  };

  const handleCambio = () => {
    setResultado(null);
    setSinCobertura(false);
    setError("");
    onLimpiar();
  };

  return (
    <div className="space-y-4">
      {/* Fila 1: Tipo de vía + número + letra */}
      <div>
        <p className="mb-2 text-sm font-medium text-cafe">Vía principal</p>
        <div className="flex gap-2">
          {/* Tipo de vía — selector */}
          <select
            value={tipoVia}
            onChange={(e) => { setTipoVia(e.target.value); handleCambio(); }}
            className="rounded-md border border-maiz-3 bg-maiz px-3 py-2.5 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
          >
            {TIPOS_VIA.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Número de vía — solo números */}
          <input
            type="number"
            min="1"
            placeholder="34"
            value={numeroVia}
            onChange={(e) => { setNumeroVia(e.target.value); handleCambio(); }}
            className="w-20 rounded-md border border-maiz-3 bg-maiz px-3 py-2.5 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
          />

          {/* Letra complementaria — selector opcional */}
          <select
            value={letraVia}
            onChange={(e) => { setLetraVia(e.target.value); handleCambio(); }}
            className="rounded-md border border-maiz-3 bg-maiz px-3 py-2.5 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
          >
            <option value="">Sin letra</option>
            {["A","B","C","D","E","F"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <p className="mt-1 text-xs text-cafe-3">Ej: Carrera 34 A → selecciona "Carrera", escribe "34", letra "A"</p>
      </div>

      {/* Fila 2: Barrio (opcional, texto libre) */}
      <div>
        <p className="mb-2 text-sm font-medium text-cafe">Barrio <span className="text-cafe-3 font-normal">(opcional, mejora la precisión)</span></p>
        <input
          type="text"
          placeholder="Ej: La Doctora, El Carmelo, Ciudad del Río..."
          value={barrio}
          onChange={(e) => { setBarrio(e.target.value); handleCambio(); }}
          className="w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2.5 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
        />
      </div>

      {/* Fila 3: Municipio — selector */}
      <div>
        <p className="mb-2 text-sm font-medium text-cafe">Municipio</p>
        <select
          value={municipio}
          onChange={(e) => { setMunicipio(e.target.value); handleCambio(); }}
          className="w-full rounded-md border border-maiz-3 bg-maiz px-3 py-2.5 text-sm text-cafe outline-none focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/15"
        >
          {MUNICIPIOS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Dirección armada (previsualización) */}
      {numeroVia && (
        <div className="rounded-lg bg-maiz-2 px-3 py-2 text-xs text-cafe-2">
          <span className="font-semibold">Tu dirección: </span>
          {construirDireccionLegible()}
        </div>
      )}

      {/* Botón verificar */}
      {!resultado && !sinCobertura && (
        <button
          type="button"
          onClick={handleVerificar}
          disabled={verificando || !numeroVia}
          className="w-full rounded-md bg-cafe px-4 py-2.5 text-sm font-semibold text-maiz hover:bg-cafe/90 disabled:opacity-50 transition-colors"
        >
          {verificando ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-maiz/30 border-t-maiz" />
              Verificando ubicación...
            </span>
          ) : "Verificar dirección y calcular envío"}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-aji/30 bg-aji/10 px-3 py-2 text-sm text-aji">{error}</div>
      )}

      {/* Resultado exitoso */}
      {resultado && (
        <div className="rounded-lg border border-hoja/30 bg-hoja/10 px-4 py-3">
          <p className="text-sm font-semibold text-hoja">✓ Ubicación confirmada</p>
          <p className="text-sm text-cafe mt-0.5">{resultado.direccion}</p>
          <p className="text-sm font-medium text-cafe mt-1">
            Costo de envío: <span className="font-bold text-rojo-ladrillo">{formatCOP(resultado.costo)}</span>
            <span className="ml-2 text-cafe-3 text-xs">— {resultado.mensaje}</span>
          </p>
          <button
            type="button"
            onClick={handleCambio}
            className="mt-2 text-xs text-cafe-2 underline hover:text-cafe"
          >
            Cambiar dirección
          </button>
        </div>
      )}

      {/* Sin cobertura */}
      {sinCobertura && (
        <div className="rounded-lg border border-aji/30 bg-aji/10 px-4 py-3">
          <p className="text-sm font-semibold text-aji">✗ Fuera de cobertura</p>
          <p className="text-sm text-cafe-2 mt-1">
            Solo hacemos domicilios hasta 5 km del Parque de Sabaneta.
          </p>
          <button
            type="button"
            onClick={handleCambio}
            className="mt-2 text-xs text-cafe-2 underline hover:text-cafe"
          >
            Intentar con otra dirección
          </button>
        </div>
      )}

      <p className="text-xs text-cafe-3">
        Cobertura: hasta 5 km desde el Parque Principal de Sabaneta.
      </p>
    </div>
  );
}