// lib/auth.ts
// Utilidades de autenticación: hash de contraseñas y verificación de sesión

import { cookies } from "next/headers";
import prisma from "./prisma";

/**
 * Obtiene el usuario de la sesión actual leyendo la cookie "session_userId".
 * Retorna null si no hay sesión o el usuario no existe.
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_userId")?.value;
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, deleted: false, enabled: true },
      select: { id: true, name: true, email: true, role: true, image: true },
    });
    return user;
  } catch {
    return null;
  }
}
