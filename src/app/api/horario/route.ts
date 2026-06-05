// app/api/horario/route.ts
// GET /api/horario — Retorna si el restaurante está abierto ahora mismo
// El frontend puede llamarlo al cargar la página de pedidos para
// mostrar un aviso antes de intentar crear un pedido.

import { NextResponse } from "next/server";

const HORA_APERTURA = 11;
const HORA_CIERRE   = 19;
const DIAS_ATENCION = [1, 2, 3, 4, 5, 6]; // Lunes a Sábado
const DIAS_NOMBRE   = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export async function GET(): Promise<NextResponse> {
  const ahora      = new Date();
  const enColombia = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const dia        = enColombia.getDay();
  const hora       = enColombia.getHours();
  const minutos    = enColombia.getMinutes();
  const horaActual = hora + minutos / 60;

  const esDiaHabil  = DIAS_ATENCION.includes(dia);
  const estaEnHora  = horaActual >= HORA_APERTURA && horaActual < HORA_CIERRE;
  const abierto     = esDiaHabil && estaEnHora;

  // Calcular cuánto falta para abrir (si está cerrado)
  let proximaApertura: string | null = null;
  if (!abierto) {
    if (!esDiaHabil || horaActual >= HORA_CIERRE) {
      // Buscar el próximo día hábil
      let diasSiguiente = 1;
      while (!DIAS_ATENCION.includes((dia + diasSiguiente) % 7)) {
        diasSiguiente++;
      }
      const nombreDia = diasSiguiente === 1 ? "Mañana" : DIAS_NOMBRE[(dia + diasSiguiente) % 7];
      proximaApertura = `${nombreDia} a las 11:00 a.m.`;
    } else {
      proximaApertura = "Hoy a las 11:00 a.m.";
    }
  }

  return NextResponse.json({
    abierto,
    hora_actual_colombia: enColombia.toLocaleTimeString("es-CO", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    }),
    dia_actual:    DIAS_NOMBRE[dia],
    horario:       "Lunes a sábado, 11:00 a.m. – 7:00 p.m.",
    proxima_apertura: proximaApertura,
    mensaje: abierto
      ? `Estamos abiertos. Atendemos hasta las 7:00 p.m.`
      : `Estamos cerrados. ${proximaApertura ? `Abrimos ${proximaApertura.toLowerCase()}.` : ""}`,
  });
}