# La Cuchara — Sistema de Gestión de Restaurante

Sistema web de administración para el restaurante **La Cuchara**, especializado en comida típica colombiana. Desarrollado con Next.js 14, React, TailwindCSS y Supabase.
[Ver aplicación desplegada](https://la-cuchara-restaurante.vercel.app/)

## Integrantes del Equipo

| Nombre | Rol |
|--------|-----|
| Yiyi Alejandra López Torres | Backend / Frontend / BD |
| Maria Carolina Cardona Calderon | Backend / Frontend / BD |
| Darwin Andrés Tangarife Avendaño | Backend / Frontend / BD|

## Usuarios de prueba

| Correo | Contraseña | Rol |
|--------|-----------|-----|
| admin@lacuchara.co | Admin2026* | ADMIN | Panel completo |
| mesero@lacuchara.co | User2026* | USER | Pedidos e inventario |
| *(registro público)* | *(definida por el usuario)* | CLIENTE | Hacer pedidos |

> Los clientes se registran públicamente desde `/auth?mode=register` y obtienen el rol **CLIENTE**.

---
 
## Información del restaurante
 
**Nombre:** La Cuchara — Cocina típica colombiana  
**Ubicación:** Parque Principal de Sabaneta, Antioquia, Colombia  
**Coordenadas:** 6.15155, -75.61657
 
### Horario de atención
| Día | Horario |
|-----|---------|
| Lunes a Sábado | 11:00 a.m. – 7:00 p.m. |
| Domingo | Cerrado |
 
> Los pedidos solo pueden crearse dentro del horario de atención. El sistema rechaza pedidos fuera de horario con un mensaje informativo.
 
### Modalidades de entrega
| Modalidad | Descripción |
|-----------|-------------|
| **Domicilio** | El restaurante lleva el pedido a la dirección del cliente |
| **Recogida en punto** | El cliente recoge en el Parque Principal de Sabaneta |
 
### Tarifas de domicilio
| Distancia desde el restaurante | Costo |
|-------------------------------|-------|
| 0 – 2 km | $7.000 COP (tarifa plana) |
| 2 – 5 km | $1.000 COP adicionales por kilómetro |
| Más de 5 km | Sin cobertura — no se genera el pedido |
 
> La distancia se calcula usando la fórmula Haversine sobre las coordenadas reales del cliente, obtenidas mediante la API de Google Maps Geocoding.
 
---
 
## Roles del sistema
 
### ADMIN
- Acceso completo a todas las funcionalidades
- Gestión de usuarios (crear, editar rol, activar/desactivar)
- Crear y editar platos del menú y categorías
- Gestión de maestros de inventario (crear insumos)
- Ver y registrar movimientos de inventario
- Ver y gestionar todos los pedidos
- Ver reportes
### USER (Empleado)
- Ver y gestionar pedidos (avanzar estados)
- Ver inventario y registrar movimientos de entrada/salida
- Ver platos del menú
- **No puede** gestionar usuarios ni crear maestros
### CLIENTE
- Crear cuenta mediante registro público
- Hacer pedidos a domicilio o para recoger
- Ver el historial y estado de sus propios pedidos
- **No tiene acceso** al panel de administración
---
 
## Tecnologías
 
| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| UI | React 18 + TailwindCSS |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL en Supabase |
| Autenticación | Cookies HTTP-only + bcryptjs |
| Geocodificación | Google Maps Geocoding API |
| Despliegue | Vercel |
 
---
 
## Instalación local
 
### Requisitos
- Node.js v18 o superior
- Cuenta en [Supabase](https://supabase.com)
- API Key de [Google Maps Geocoding](https://console.cloud.google.com)
### Pasos
 
```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_ORG/nombreEquipo-Restaurante.git
cd nombreEquipo-Restaurante
 
# 2. Instalar dependencias
npm install
 
# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales
 
# 4. Crear las tablas en Supabase
npx prisma migrate dev --name lacuchara-inicial
 
# 5. Poblar la base de datos con datos iniciales
# Con el servidor corriendo (npm run dev), ejecutar en otra terminal:
curl -X POST http://localhost:3000/api/seed
 
# 6. Arrancar el servidor
npm run dev
```
 
Abre [http://localhost:3000](http://localhost:3000)
 
---
 
## Variables de entorno
 
Crea un archivo `.env` en la raíz del proyecto (nunca se sube a GitHub):
 
```env
# Base de datos Supabase
DATABASE_URL="postgresql://postgres.bnfawqyixbeftyuzpzux:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
 
# Google Maps Geocoding API
GOOGLE_MAPS_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```
 
---
 
## Estructura del proyecto
 
```
src/
├── app/
│   ├── page.tsx                      # Landing page pública
│   ├── auth/page.tsx                 # Login y registro
│   ├── (admin)/                      # Panel interno (ADMIN y USER)
│   │   ├── layout.tsx                # Layout con sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── pedidos/page.tsx          # Gestión de pedidos
│   │   ├── platos/page.tsx           # Menú del restaurante
│   │   ├── inventario/page.tsx       # Maestros y movimientos
│   │   ├── usuarios/page.tsx         # Gestión de usuarios (solo ADMIN)
│   │   └── reportes/page.tsx
│   ├── (cliente)/                    # Portal del cliente (CLIENTE)
│   │   ├── layout.tsx
│   │   ├── pedido/page.tsx           # Crear pedido
│   │   └── historial/page.tsx        # Ver mis pedidos
│   └── api/                          # Backend — API Routes
│       ├── auth/login/               # POST: iniciar sesión
│       ├── auth/logout/              # POST: cerrar sesión
│       ├── auth/me/                  # GET: usuario activo
│       ├── auth/register/            # POST: registro de clientes
│       ├── user/                     # POST/PUT: crear y editar usuarios
│       ├── users/                    # GET: listar usuarios
│       ├── maestros/                 # GET/POST: insumos del inventario
│       ├── movimientos/              # GET/POST: transacciones de inventario
│       ├── platos/                   # CRUD platos del menú
│       ├── categorias/               # GET/POST categorías
│       ├── clientes/                 # CRUD clientes
│       ├── pedidos/                  # GET/POST/PUT pedidos
│       ├── domicilio/                # POST: calcular costo de envío
│       ├── geocodificar/             # POST: dirección → coordenadas
│       ├── horario/                  # GET: estado de apertura del restaurante
│       └── seed/                     # POST: datos iniciales (solo desarrollo)
├── lib/
│   ├── prisma.ts                     # Cliente Prisma singleton
│   └── auth.ts                       # Leer sesión desde cookie
└── contexts/
    └── SessionContext.tsx            # Estado global del usuario logueado
prisma/
└── schema.prisma                     # Esquema de la base de datos
```
 
---
 
## API Endpoints principales
 
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | `/api/auth/login` | Iniciar sesión | Público |
| POST | `/api/auth/register` | Registro de cliente | Público |
| POST | `/api/auth/logout` | Cerrar sesión | Auth |
| GET | `/api/auth/me` | Usuario activo | Auth |
| GET | `/api/users` | Listar usuarios | ADMIN |
| POST/PUT | `/api/user` | Crear/editar usuario | ADMIN |
| GET/POST | `/api/maestros` | Maestros de inventario | Auth |
| GET/POST | `/api/movimientos` | Transacciones | Auth |
| GET/POST/PUT/DELETE | `/api/platos` | Menú | Auth |
| GET/POST | `/api/categorias` | Categorías | Auth |
| GET/POST/PUT/DELETE | `/api/clientes` | Clientes | Auth |
| GET/POST/PUT | `/api/pedidos` | Pedidos | Auth |
| POST | `/api/domicilio` | Calcular costo de envío | Auth |
| POST | `/api/geocodificar` | Dirección a coordenadas | Auth |
| GET | `/api/horario` | Estado de apertura | Público |
 
---
 
## Lógica de negocio destacada
 
### Cálculo de domicilio
El endpoint `POST /api/domicilio` recibe las coordenadas del cliente y calcula la distancia al restaurante usando la **fórmula Haversine**. Aplica las tarifas según el rango de distancia y retorna el costo final. Si la distancia supera 5 km, el pedido no puede crearse.
 
### Verificación de horario
Cada vez que se intenta crear un pedido, el backend verifica la hora actual en la zona horaria `America/Bogota`. Si está fuera del horario de atención (lunes–sábado, 11 a.m.–7 p.m.), retorna error 503 con un mensaje indicando cuándo vuelve a abrir.
 
### Geocodificación de direcciones
El cliente escribe su dirección en texto libre. El backend llama a la **Google Maps Geocoding API** para convertirla en coordenadas reales, sin asumir ningún municipio. Las coordenadas obtenidas se usan para calcular la distancia y determinar si hay cobertura.
 
### Autenticación
Se usa un sistema propio con cookies HTTP-only. Las contraseñas se almacenan hasheadas con bcrypt (salt rounds: 12). No se usan tokens JWT ni servicios externos de autenticación.
 
### Movimientos de inventario
Cada movimiento de entrada o salida actualiza el saldo del maestro en una **transacción atómica** de base de datos. Si el saldo no es suficiente para una salida, la transacción se revierte y se retorna error.
 
---
 
## Despliegue en Vercel
 
1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. En **Settings → Environment Variables** agrega las variables del `.env`
3. Cada push a `main` genera un deploy automático
---
 
*Proyecto académico — Ingeniería Web, Universidad de Antioquia, 2026*
 