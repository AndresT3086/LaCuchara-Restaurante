// app/api/auth/me/route.ts
// GET /api/auth/me — Retorna el usuario de la sesión activa
// El front lo llama al cargar para saber quién está logueado

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  return NextResponse.json({ user });
}
