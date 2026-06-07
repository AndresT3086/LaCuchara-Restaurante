# La Cuchara — Sistema de Gestión de Restaurante

Sistema web de administración para el restaurante **La Cuchara**, especializado en comida típica colombiana. Desarrollado con Next.js 14, React, TailwindCSS y Supabase.

## Integrantes del Equipo

| Nombre | Rol |
|--------|-----|
| Darwin Andrés Tangarife Avendaño | Backend / Frontend / BD|
| Yiyi Alejandra López Torres | Backend / Frontend / BD |
| Maria Carolina Cardona Calderon | Backend / Frontend / BD |

## Usuarios de prueba

| Correo | Contraseña | Rol |
|--------|-----------|-----|
| admin@lacuchara.co | Admin2026* | ADMIN |
| mesero@lacuchara.co | User2026* | USER |

> Los clientes se registran públicamente desde `/auth?mode=register` y obtienen el rol **CLIENTE**.

---

## Instalación paso a paso

### Requisitos previos
- Node.js v18 o superior (`node -v`)
- Cuenta en [Supabase](https://supabase.com) (gratis)

### 1. Clonar el repositorio
```bash
git clone https://github.com/yiyilopez/front-lacuchara.git
cd front-lacuchara
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```
Edita `.env` y completa las siguientes variables:
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres"
SEED_KEY="una-clave-segura-para-el-seed"
```
> `SEED_KEY` protege el endpoint `/api/seed` en producción. En desarrollo no es necesaria.

### 4. Crear las tablas en Supabase
```bash
npx prisma migrate dev --name lacuchara-inicial
```

### 5. Crear usuarios y datos iniciales
Con el servidor corriendo (`npm run dev`), ejecuta en otra terminal:
```bash
curl -X POST http://localhost:3000/api/seed
```
O abre `http://localhost:3000/api/seed` y haz un POST desde Postman/ThunderClient.

### 6. Arrancar
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000)

---

## Roles del sistema

| Rol | Quién | Acceso |
|-----|-------|--------|
| `ADMIN` | Administrador del restaurante | Panel completo |
| `USER` | Empleado interno (mesero, cocina) | Panel sin usuarios ni reportes |
| `CLIENTE` | Cliente registrado públicamente | Solo vista de pedido (`/pedido`) |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                        # Landing page pública con carta
│   ├── auth/page.tsx                   # Login y registro de clientes
│   ├── pedido/page.tsx                 # Vista de pedido para clientes (CLIENTE)
│   ├── (admin)/                        # Panel protegido (requiere sesión ADMIN o USER)
│   │   ├── layout.tsx                  # Layout con sidebar — redirige a /auth si no hay sesión, a /pedido si es CLIENTE
│   │   ├── dashboard/page.tsx          # Resumen de operación del día
│   │   ├── pedidos/page.tsx            # Gestión de pedidos
│   │   ├── platos/
│   │   │   ├── page.tsx                # CRUD del menú
│   │   │   ├── MenuDelDia.tsx          # Componente: menú del día
│   │   │   └── PlatosEspeciales.tsx    # Componente: platos especiales
│   │   ├── inventario/page.tsx         # Maestros de inventario y movimientos
│   │   ├── transacciones/page.tsx      # Historial de transacciones de inventario
│   │   ├── usuarios/page.tsx           # Gestión de equipo interno (solo ADMIN)
│   │   └── reportes/page.tsx           # Reportes de ventas (solo ADMIN)
│   └── api/                            # Backend — API Routes
│       ├── auth/
│       │   ├── login/route.ts          # POST: iniciar sesión
│       │   ├── logout/route.ts         # POST: cerrar sesión
│       │   ├── me/route.ts             # GET: usuario activo
│       │   └── register/route.ts       # POST: registro público (crea rol CLIENTE)
│       ├── user/route.ts               # POST/PUT: crear/editar usuario interno (ADMIN)
│       ├── users/route.ts              # GET: listar equipo interno (ADMIN)
│       ├── clientes/route.ts           # GET/POST/PUT/DELETE: clientes del restaurante
│       ├── maestros/route.ts           # GET/POST: maestros de inventario
│       ├── movimientos/route.ts        # GET/POST: transacciones de inventario
│       ├── platos/route.ts             # GET/POST/PUT/DELETE: platos del menú
│       ├── categorias/route.ts         # GET/POST: categorías del menú
│       ├── pedidos/route.ts            # GET/POST/PUT: pedidos
│       ├── horario/route.ts            # GET: estado de apertura/cierre
│       ├── domicilio/route.ts          # GET: cobertura, POST: calcular costo de envío
│       └── seed/route.ts               # POST: datos iniciales (protegido en producción con SEED_KEY)
├── contexts/
│   ├── SessionContext.tsx              # Sesión activa del usuario
│   └── RoleContext.tsx                 # Contexto de rol para el panel admin
├── lib/
│   ├── prisma.ts                       # Cliente Prisma (singleton)
│   └── auth.ts                         # Utilidad: leer sesión desde la cookie
└── components/
    ├── ui/                             # Button, Badge, Dialog, Table, Input
    └── layout/                         # Sidebar, AdminPage
prisma/
└── schema.prisma                       # Esquema de la base de datos
```

---

## API Endpoints

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/api/auth/login` | Iniciar sesión | Público |
| POST | `/api/auth/logout` | Cerrar sesión | Autenticado |
| GET | `/api/auth/me` | Usuario activo | Autenticado |
| POST | `/api/auth/register` | Registro público de clientes | Público |
| GET | `/api/users` | Listar equipo interno (excluye CLIENTEs) | ADMIN |
| POST | `/api/user` | Crear usuario interno | ADMIN |
| PUT | `/api/user` | Editar rol o estado de usuario | ADMIN |
| GET | `/api/clientes` | Listar clientes (CLIENTE: solo el propio) | Auth |
| POST | `/api/clientes` | Registrar cliente | Auth |
| PUT | `/api/clientes` | Actualizar cliente | Auth |
| DELETE | `/api/clientes` | Eliminar cliente | ADMIN |
| GET | `/api/maestros` | Listar maestros de inventario | Auth |
| POST | `/api/maestros` | Crear maestro | ADMIN |
| GET | `/api/movimientos` | Movimientos de un maestro | Auth |
| POST | `/api/movimientos` | Registrar movimiento | ADMIN, USER |
| GET | `/api/platos` | Listar platos del menú | Auth |
| POST | `/api/platos` | Crear plato | ADMIN, USER |
| PUT | `/api/platos` | Editar plato | ADMIN, USER |
| DELETE | `/api/platos` | Eliminar plato | ADMIN |
| GET | `/api/categorias` | Listar categorías | Auth |
| POST | `/api/categorias` | Crear categoría | ADMIN |
| GET | `/api/pedidos` | Listar pedidos (CLIENTE: solo los propios) | Auth |
| POST | `/api/pedidos` | Crear pedido | Auth |
| PUT | `/api/pedidos` | Actualizar estado de pedido | Auth |
| GET | `/api/horario` | Estado de apertura del restaurante | Público |
| GET | `/api/domicilio` | Zonas y tarifas de cobertura | Público |
| POST | `/api/domicilio` | Calcular costo de envío por coordenadas | Auth |

---

## Despliegue en Vercel

1. Conecta el repo en [vercel.com](https://vercel.com)
2. En **Settings → Environment Variables** agrega:
   - `DATABASE_URL` con el string de Supabase de producción
   - `SEED_KEY` con una clave secreta para proteger el seed
3. Despliega y abre la URL generada por Vercel
