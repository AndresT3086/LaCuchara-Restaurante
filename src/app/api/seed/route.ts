// app/api/seed/route.ts
// POST /api/seed

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const seedKey = request.headers.get("x-seed-key");
  if (process.env.NODE_ENV === "production" && seedKey !== process.env.SEED_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    // ── 1. Usuarios ────────────────────────────────────────────────────────
    const adminPass = await bcrypt.hash("Admin2026*", 12);
    const userPass  = await bcrypt.hash("User2026*", 12);

    const admin = await prisma.user.upsert({
      where:  { email: "admin@lacuchara.co" },
      update: {},
      create: { name: "Administrador", email: "admin@lacuchara.co", password: adminPass, role: "ADMIN" },
    });

    const mesero = await prisma.user.upsert({
      where:  { email: "mesero@lacuchara.co" },
      update: {},
      create: { name: "Carlos Mesero", email: "mesero@lacuchara.co", password: userPass, role: "USER" },
    });

    // ── 2. Categorías del menú ─────────────────────────────────────────────
    const categoriasData = [
      { nombre: "Sopas y caldos",    descripcion: "Sopas tradicionales colombianas" },
      { nombre: "Secos",             descripcion: "Platos fuertes con arroz y proteína" },
      { nombre: "Bandeja",           descripcion: "La emblemática bandeja paisa y variantes" },
      { nombre: "Bebidas",           descripcion: "Jugos naturales, refrescos y bebidas calientes" },
      { nombre: "Postres",           descripcion: "Dulces típicos colombianos" },
      { nombre: "Entradas",          descripcion: "Aperitivos y entradas" },
    ];

    const categorias: Record<string, string> = {};
    for (const cat of categoriasData) {
      const c = await prisma.categoria.upsert({
        where:  { nombre: cat.nombre },
        update: {},
        create: cat,
      });
      categorias[cat.nombre] = c.id;
    }

    // ── 3. Platos del menú ─────────────────────────────────────────────────
    const platosData = [
      // Sopas
      { nombre: "Ajiaco santafereño",    descripcion: "Caldo de tres papas con pollo, guasca y mazorca. Acompañado de crema y alcaparras.", precio: 22000, cat: "Sopas y caldos" },
      { nombre: "Sancocho de gallina",   descripcion: "Caldo contundente de gallina criolla con yuca, papa, plátano y cilantro.", precio: 20000, cat: "Sopas y caldos" },
      { nombre: "Caldo de costilla",     descripcion: "Caldo reconfortante de costilla de res con papa y cebolla larga. Ideal para comenzar el día.", precio: 14000, cat: "Sopas y caldos" },
      { nombre: "Sopa de lentejas",      descripcion: "Lentejas guisadas con hogao, chorizo y verduras de temporada.", precio: 16000, cat: "Sopas y caldos" },
      // Secos
      { nombre: "Sudado de pollo",       descripcion: "Pollo en salsa de tomate y cebolla con papa, arroz blanco y ensalada.", precio: 19000, cat: "Secos" },
      { nombre: "Bistec a caballo",      descripcion: "Lomo de res encebollado con huevo frito, papa criolla y arroz.", precio: 24000, cat: "Secos" },
      { nombre: "Trucha al ajillo",      descripcion: "Trucha arco iris al vapor con mantequilla, ajo y limón. Con arroz y patacones.", precio: 28000, cat: "Secos" },
      { nombre: "Fríjoles con garra",    descripcion: "Fríjoles cargamanto con pezuña de cerdo, tocino y chorizo. La receta de la abuela.", precio: 21000, cat: "Secos" },
      // Bandeja
      { nombre: "Bandeja paisa",         descripcion: "Fríjoles, arroz, carne molida, chicharrón, chorizo, morcilla, huevo, plátano y aguacate.", precio: 32000, cat: "Bandeja" },
      { nombre: "Bandeja ejecutiva",     descripcion: "Versión compacta de la bandeja: fríjoles, arroz, carne asada, plátano y ensalada.", precio: 26000, cat: "Bandeja" },
      // Entradas
      { nombre: "Patacones con hogao",   descripcion: "Dos patacones de plátano verde con hogao casero y suero costeño.", precio: 9000,  cat: "Entradas" },
      { nombre: "Empanadas de pipián",   descripcion: "Tres empanadas de maíz rellenas de papa con pipián. Con ají de maní.", precio: 10000, cat: "Entradas" },
      { nombre: "Arepa de chócolo",      descripcion: "Arepa de maíz tierno con queso campesino derretido.", precio: 8000,  cat: "Entradas" },
      // Bebidas
      { nombre: "Jugo de maracuyá",      descripcion: "Jugo natural de maracuyá en agua o leche. Sin azúcar disponible.", precio: 7000,  cat: "Bebidas" },
      { nombre: "Jugo de lulo",          descripcion: "Lulo fresco de cosecha. En agua o leche.", precio: 7000,  cat: "Bebidas" },
      { nombre: "Chocolate santafereño", descripcion: "Chocolate caliente con queso y almojábana. La merienda perfecta.", precio: 9000,  cat: "Bebidas" },
      { nombre: "Aguapanela con limón",  descripcion: "Aguapanela caliente o fría con limón y hierbabuena.", precio: 5000,  cat: "Bebidas" },
      { nombre: "Limonada de coco",      descripcion: "Limonada con leche de coco, menta y hielo. Refrescante.", precio: 9000,  cat: "Bebidas" },
      // Postres
      { nombre: "Postre de natas",       descripcion: "Cremoso postre de natas con arequipe y galleta. Receta tradicional.", precio: 8000,  cat: "Postres" },
      { nombre: "Mazamorra antioqueña",  descripcion: "Mazamorra de maíz blanco con panela y leche. Acompañada de bocadillo.", precio: 7000,  cat: "Postres" },
      { nombre: "Arroz con leche",       descripcion: "Arroz con leche con canela y pasas. Servido frío.", precio: 7000,  cat: "Postres" },
    ];

    for (const p of platosData) {
      const existe = await prisma.plato.findFirst({ where: { nombre: p.nombre } });
      if (!existe) {
        await prisma.plato.create({
          data: {
            nombre:       p.nombre,
            descripcion:  p.descripcion,
            precio:       p.precio,
            categoriaId:  categorias[p.cat],
            creadoPorId:  admin.id,
            disponible:   true,
          },
        });
      }
    }

    // ── 4. Maestros de inventario (materias primas) ────────────────────────
    const maestrosData = [
      // Carnes y proteínas
      { nombre: "Pollo entero",         unidad: "kg",    saldo: 15 },
      { nombre: "Carne de res (lomo)",  unidad: "kg",    saldo: 8  },
      { nombre: "Costilla de res",      unidad: "kg",    saldo: 6  },
      { nombre: "Chorizo antioqueño",   unidad: "unid",  saldo: 40 },
      { nombre: "Chicharrón",           unidad: "kg",    saldo: 4  },
      { nombre: "Morcilla",             unidad: "unid",  saldo: 20 },
      { nombre: "Trucha arco iris",     unidad: "kg",    saldo: 5  },
      { nombre: "Tocino",               unidad: "kg",    saldo: 3  },
      // Granos y cereales
      { nombre: "Arroz blanco",         unidad: "kg",    saldo: 30 },
      { nombre: "Fríjoles cargamanto",  unidad: "kg",    saldo: 12 },
      { nombre: "Lentejas",             unidad: "kg",    saldo: 8  },
      { nombre: "Maíz blanco",          unidad: "kg",    saldo: 10 },
      { nombre: "Harina de maíz",       unidad: "kg",    saldo: 15 },
      // Tubérculos y verduras
      { nombre: "Papa pastusa",         unidad: "kg",    saldo: 25 },
      { nombre: "Papa criolla",         unidad: "kg",    saldo: 15 },
      { nombre: "Papa sabanera",        unidad: "kg",    saldo: 10 },
      { nombre: "Yuca",                 unidad: "kg",    saldo: 8  },
      { nombre: "Plátano verde",        unidad: "unid",  saldo: 30 },
      { nombre: "Plátano maduro",       unidad: "unid",  saldo: 20 },
      { nombre: "Mazorca",              unidad: "unid",  saldo: 15 },
      { nombre: "Tomate chonto",        unidad: "kg",    saldo: 6  },
      { nombre: "Cebolla larga",        unidad: "kg",    saldo: 5  },
      { nombre: "Cebolla cabezona",     unidad: "kg",    saldo: 4  },
      // Lácteos
      { nombre: "Leche entera",         unidad: "L",     saldo: 20 },
      { nombre: "Queso campesino",      unidad: "kg",    saldo: 4  },
      { nombre: "Crema de leche",       unidad: "L",     saldo: 3  },
      { nombre: "Mantequilla",          unidad: "kg",    saldo: 2  },
      // Frutas
      { nombre: "Maracuyá",             unidad: "kg",    saldo: 8  },
      { nombre: "Lulo",                 unidad: "kg",    saldo: 6  },
      { nombre: "Limón Tahití",         unidad: "kg",    saldo: 5  },
      // Despensa
      { nombre: "Panela",               unidad: "unid",  saldo: 20 },
      { nombre: "Chocolate de mesa",    unidad: "unid",  saldo: 10 },
      { nombre: "Aceite vegetal",       unidad: "L",     saldo: 8  },
      { nombre: "Sal",                  unidad: "kg",    saldo: 5  },
      { nombre: "Guasca seca",          unidad: "g",     saldo: 200},
      { nombre: "Alcaparras",           unidad: "g",     saldo: 300},
      { nombre: "Cilantro fresco",      unidad: "kg",    saldo: 2  },
      { nombre: "Ajo",                  unidad: "kg",    saldo: 2  },
    ];

    for (const m of maestrosData) {
      const existe = await prisma.maestro.findFirst({ where: { nombre: m.nombre } });
      if (!existe) {
        await prisma.maestro.create({
          data: { ...m, creadoPorId: admin.id },
        });
      }
    }

    // ── 5. Clientes de ejemplo ─────────────────────────────────────────────
    const clientesData = [
      { nombre: "María Gómez",    telefono: "3001234567", email: "maria@email.com",  direccion: "Calle 45 #12-30, El Poblado",     puntoReferencia: "Frente al parque de El Poblado" },
      { nombre: "Juan Martínez",  telefono: "3109876543", email: null,               direccion: "Carrera 70 #50-20, Laureles",      puntoReferencia: "Edificio azul, apto 301" },
      { nombre: "Sofía Restrepo", telefono: "3157654321", email: "sofia@email.com",  direccion: "Avenida El Poblado #1-50, Medellín", puntoReferencia: null },
    ];

    for (const c of clientesData) {
      const existe = await prisma.cliente.findFirst({ where: { nombre: c.nombre } });
      if (!existe) {
        await prisma.cliente.create({ data: c });
      }
    }

    // ── 6. Movimientos de ejemplo para ver gráficas ────────────────────────
    const arroz = await prisma.maestro.findFirst({ where: { nombre: "Arroz blanco" } });
    const frijoles = await prisma.maestro.findFirst({ where: { nombre: "Fríjoles cargamanto" } });

    if (arroz) {
      const movs = [
        { tipo: "ENTRADA" as const, cantidad: 10, nota: "Compra proveedor La Cosecha", dias: -6 },
        { tipo: "SALIDA"  as const, cantidad: 3,  nota: "Consumo cocina lunes",        dias: -5 },
        { tipo: "SALIDA"  as const, cantidad: 2,  nota: "Consumo cocina martes",       dias: -4 },
        { tipo: "ENTRADA" as const, cantidad: 15, nota: "Compra semanal",              dias: -3 },
        { tipo: "SALIDA"  as const, cantidad: 4,  nota: "Consumo cocina miércoles",    dias: -2 },
        { tipo: "SALIDA"  as const, cantidad: 3,  nota: "Consumo cocina jueves",       dias: -1 },
      ];
      for (const mov of movs) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + mov.dias);
        const existeMov = await prisma.movimiento.findFirst({
          where: { maestroId: arroz.id, nota: mov.nota }
        });
        if (!existeMov) {
          await prisma.movimiento.create({
            data: {
              maestroId:     arroz.id,
              tipo:          mov.tipo,
              cantidad:      mov.cantidad,
              nota:          mov.nota,
              fecha,
              responsableId: mov.tipo === "ENTRADA" ? admin.id : mesero.id,
            },
          });
        }
      }
    }

    if (frijoles) {
      const movs = [
        { tipo: "ENTRADA" as const, cantidad: 8,  nota: "Compra proveedor",     dias: -5 },
        { tipo: "SALIDA"  as const, cantidad: 2,  nota: "Cocina lunes",         dias: -4 },
        { tipo: "SALIDA"  as const, cantidad: 1.5,nota: "Cocina martes",        dias: -3 },
        { tipo: "ENTRADA" as const, cantidad: 5,  nota: "Compra emergencia",    dias: -2 },
        { tipo: "SALIDA"  as const, cantidad: 2,  nota: "Cocina miércoles",     dias: -1 },
      ];
      for (const mov of movs) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + mov.dias);
        const existeMov = await prisma.movimiento.findFirst({
          where: { maestroId: frijoles.id, nota: mov.nota }
        });
        if (!existeMov) {
          await prisma.movimiento.create({
            data: {
              maestroId:     frijoles.id,
              tipo:          mov.tipo,
              cantidad:      mov.cantidad,
              nota:          mov.nota,
              fecha,
              responsableId: mov.tipo === "ENTRADA" ? admin.id : mesero.id,
            },
          });
        }
      }
    }

    return NextResponse.json({
      message: "✅ Base de datos poblada exitosamente",
      resumen: {
        usuarios:    2,
        categorias:  categoriasData.length,
        platos:      platosData.length,
        maestros:    maestrosData.length,
        clientes:    clientesData.length,
        movimientos: "varios (arroz y fríjoles)",
      },
      credenciales: [
        { email: "admin@lacuchara.co",  password: "Admin2026*", rol: "ADMIN" },
        { email: "mesero@lacuchara.co", password: "User2026*",  rol: "USER"  },
      ],
    });
  } catch (error) {
    console.error("[POST /api/seed]", error);
    return NextResponse.json({ error: "Error al poblar la base de datos", detalle: String(error) }, { status: 500 });
  }
}