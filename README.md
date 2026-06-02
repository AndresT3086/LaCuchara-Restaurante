# La Cuchara — Sistema de Gestión de Restaurante

Sistema web de administración para el restaurante **La Cuchara**, especializado en comida típica colombiana. Desarrollado con Next.js 14, React, TailwindCSS y Supabase.

## Integrantes del Equipo

| Nombre | Rol |
|--------|-----|
| [Nombre 1] | Backend |
| [Nombre 2] | Frontend |
| [Nombre 3] | Frontend / BD |

## Usuarios de prueba

| Correo | Contraseña | Rol |
|--------|-----------|-----|
| admin@lacuchara.co | Admin2026* | ADMIN |
| mesero@lacuchara.co | User2026* | USER |

---

## Instalación paso a paso

### Requisitos previos
- Node.js v18 o superior (`node -v`)
- Cuenta en [Supabase](https://supabase.com) (gratis)

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_ORG/nombreEquipo-Restaurante.git
cd nombreEquipo-Restaurante
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```
Edita `.env` y pega el string de conexión de Supabase:
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres"
```

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

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                     # Landing page pública
│   ├── auth/page.tsx                # Login / registro
│   ├── (admin)/                     # Páginas protegidas (requieren sesión)
│   │   ├── layout.tsx               # Layout con sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── pedidos/page.tsx
│   │   ├── platos/page.tsx
│   │   ├── inventario/page.tsx      # Página de Maestros/Transacciones
│   │   ├── usuarios/page.tsx
│   │   └── reportes/page.tsx
│   └── api/                         # Backend — API Routes
│       ├── auth/login/route.ts      # POST: iniciar sesión
│       ├── auth/logout/route.ts     # POST: cerrar sesión
│       ├── auth/me/route.ts         # GET: usuario activo
│       ├── user/route.ts            # POST/PUT: crear/editar usuario
│       ├── users/route.ts           # GET: listar usuarios
│       ├── maestros/route.ts        # GET/POST: maestros de inventario
│       ├── movimientos/route.ts     # GET/POST: transacciones
│       ├── platos/route.ts          # CRUD platos del menú
│       ├── categorias/route.ts      # GET/POST categorías
│       ├── pedidos/route.ts         # GET/POST/PUT pedidos
│       └── seed/route.ts            # POST: datos iniciales (solo desarrollo)
├── lib/
│   ├── prisma.ts                    # Cliente Prisma (singleton)
│   └── auth.ts                      # Utilidad: leer sesión de la cookie
└── ...componentes y contextos del front
prisma/
└── schema.prisma                    # Esquema de la base de datos
```

---

## API Endpoints

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/api/auth/login` | Iniciar sesión | Público |
| POST | `/api/auth/logout` | Cerrar sesión | Autenticado |
| GET | `/api/auth/me` | Usuario activo | Autenticado |
| GET | `/api/users` | Listar usuarios | ADMIN |
| POST/PUT | `/api/user` | Crear/editar usuario | ADMIN |
| GET/POST | `/api/maestros` | Maestros (GET: todos, POST: solo ADMIN) | Auth |
| GET/POST | `/api/movimientos` | Transacciones de inventario | Auth |
| GET/POST/PUT/DELETE | `/api/platos` | Menú | Auth |
| GET/POST | `/api/categorias` | Categorías del menú | Auth |
| GET/POST/PUT | `/api/pedidos` | Pedidos | Auth |

---

## Despliegue en Vercel

1. Conecta el repo en [vercel.com](https://vercel.com)
2. En **Settings → Environment Variables** agrega `DATABASE_URL` con el string de Supabase de producción
3. El nombre del proyecto en Vercel debe ser `nombreEquipoRestaurante` para que la URL quede `nombreEquipoRestaurante.vercel.app`
