// app/api/auth/logout/route.ts
// POST /api/auth/logout — Cierra la sesión borrando la cookie

import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ message: "Sesión cerrada" });
  response.cookies.set("session_userId", "", { maxAge: 0, path: "/" });
  return response;
}
