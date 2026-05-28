import Link from "next/link";

const MENU_HOY = {
  fecha: "Miércoles 27 de mayo",
  sopa: "Crema de auyama con cilantro",
  secos: ["Pollo a la plancha", "Sobrebarriga en salsa criolla", "Cerdo apanado"],
  acompanantes: "Arroz, fríjoles, ensalada y tajada madura",
  jugo: "Mora, lulo o maracuyá",
  postre: "Arroz con leche con canela",
  precios: {
    completo: 15000,
    sinSopa: 13000,
    sinPostre: 13500,
    basico: 11000,
  },
};

const ESPECIALES = [
  {
    nombre: "Bandeja paisa",
    detalle: "Fríjoles, chicharrón, carne molida, chorizo, arroz, huevo y aguacate",
    precio: 28000,
    inicial: "B",
  },
  {
    nombre: "Trucha al ajillo",
    detalle: "Trucha dorada, patacón, ensalada fresca y arroz con coco",
    precio: 32000,
    inicial: "T",
  },
  {
    nombre: "Posta negra",
    detalle: "Salsa negra cartagenera, arroz con coco y tajadas maduras",
    precio: 26000,
    inicial: "P",
  },
];

function formatCOP(value: number) {
  return `$${new Intl.NumberFormat("es-CO").format(value)}`;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-maiz text-cafe">
      <header className="sticky top-0 z-20 border-b border-maiz-3 bg-maiz/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6 lg:gap-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-achiote/25 bg-achiote/10 text-achiote">
              <svg width="25" height="25" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M18.8 4.2c2 2.1 1.9 5.4-.2 7.4l-4.1 3.9 2.8 2.9 4.1-3.9c3.7-3.5 3.8-9.3.3-12.9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M12 15.7l4.2 4.4-8.4 8.1a3 3 0 01-4.2-.1 3 3 0 01.1-4.2l8.3-8.2z" fill="currentColor" opacity=".9" />
              </svg>
            </span>
            <span>
              <span className="block font-heading text-2xl font-extrabold leading-none text-rojo-ladrillo">
                La Cuchara
              </span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-cafe-2">
                Corrientazo casero
              </span>
            </span>
          </Link>
          <nav className="ml-4 hidden gap-6 text-sm font-medium text-cafe-2 md:flex">
            <a href="#menu" className="hover:text-rojo-ladrillo">Menú</a>
            <a href="#especiales" className="hover:text-rojo-ladrillo">Especiales</a>
            <a href="#pedido" className="hover:text-rojo-ladrillo">Pedido</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/auth?mode=login" className="rounded-md px-3 py-2 text-sm font-semibold text-cafe-2 hover:bg-maiz-2 hover:text-cafe">
              Entrar
            </Link>
            <a
              href="#pedido"
              className="rounded-md bg-rojo-ladrillo px-4 py-2.5 text-sm font-semibold text-maiz shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-rojo-ladrillo-dark"
            >
              Pedir ahora
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20">
          <div>
            <p className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-achiote-dark before:h-0.5 before:w-6 before:bg-achiote">
              Cocina oculta · domicilio y recoger
            </p>
            <h1 className="font-heading text-5xl font-extrabold leading-[0.98] text-cafe sm:text-6xl">
              Corrientazo casero, servido como en casa.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-cafe-2">
              Menú del día con sopa, seco a elección, jugo y postre. Puedes pedir para recoger o a domicilio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#menu" className="rounded-md bg-rojo-ladrillo px-5 py-3 text-sm font-semibold text-maiz hover:bg-rojo-ladrillo-dark">
                Ver menú de hoy
              </a>
              <a href="#especiales" className="rounded-md border border-maiz-3 bg-elevated px-5 py-3 text-sm font-semibold text-cafe hover:bg-maiz-2">
                Platos especiales
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-8 border-t border-dashed border-maiz-3 pt-6">
              <HeroMeta label="Estado" value="Abierto hoy" dot />
              <HeroMeta label="Tiempo" value="25-35 min" />
              <HeroMeta label="Desde" value={formatCOP(MENU_HOY.precios.basico)} />
            </div>
          </div>

          <div className="relative min-h-[540px] overflow-hidden rounded-[18px] bg-cafe shadow-[0_30px_60px_-20px_rgba(58,36,24,0.35),0_10px_20px_-10px_rgba(58,36,24,0.2)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_35%_25%,rgba(248,220,160,0.58),transparent_38%),radial-gradient(ellipse_at_72%_65%,rgba(180,50,30,0.5),transparent_52%),linear-gradient(160deg,#E07A2C_0%,#B85E18_48%,#6E1212_100%)]" />
            <div className="absolute left-1/2 top-[46%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-maiz shadow-[0_24px_50px_rgba(58,36,24,0.42)]">
              <div className="absolute inset-7 rounded-full bg-[#F7E2B8]" />
              <div className="absolute left-16 top-16 h-20 w-28 rounded-full bg-[#7D4B2B]" />
              <div className="absolute right-14 top-20 h-16 w-24 rounded-full bg-[#D18A2F]" />
              <div className="absolute bottom-16 left-20 h-16 w-28 rounded-full bg-hoja" />
              <div className="absolute bottom-20 right-16 h-20 w-20 rounded-full bg-rojo-ladrillo" />
            </div>
            <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-maiz px-4 py-2 font-heading text-sm font-bold text-rojo-ladrillo shadow-warm-md">
              <span className="h-2 w-2 rounded-full bg-hoja" />
              Menú activo hoy
            </div>
            <div className="absolute -right-4 bottom-16 rotate-[-3deg] rounded-l rounded-r-xl bg-cafe px-7 py-4 text-maiz shadow-[0_12px_24px_-6px_rgba(58,36,24,0.5)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-maiz/70">Completo</p>
              <p className="font-heading text-3xl font-extrabold text-achiote">{formatCOP(MENU_HOY.precios.completo)}</p>
            </div>
          </div>
        </section>

        <section id="menu" className="mx-auto max-w-6xl px-6 py-16">
          <SectionHead
            eyebrow="Menú del día"
            title="El corrientazo de hoy"
            subtitle="Escoge tu seco y ajusta el combo según tengas antojo de sopa o postre."
          />
          <div className="grid overflow-hidden rounded-3xl border border-maiz-3 bg-elevated shadow-warm-md lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 lg:p-10">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-achiote-dark">{MENU_HOY.fecha}</p>
              <h3 className="mb-7 font-heading text-3xl font-extrabold text-cafe">Servicio del mediodía</h3>
              <Course number="1" title="Sopa" desc={MENU_HOY.sopa} />
              <Course number="2" title="Seco · escoge uno" desc={MENU_HOY.acompanantes}>
                <div className="mt-3 flex flex-wrap gap-2">
                  {MENU_HOY.secos.map((seco, index) => (
                    <span
                      key={seco}
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        index === 0 ? "border-rojo-ladrillo bg-rojo-ladrillo text-maiz" : "border-maiz-3 bg-maiz text-cafe",
                      ].join(" ")}
                    >
                      {seco}
                    </span>
                  ))}
                </div>
              </Course>
              <Course number="3" title="Jugo natural" desc={MENU_HOY.jugo} />
              <Course number="4" title="Postre" desc={MENU_HOY.postre} />
            </div>
            <div id="pedido" className="relative bg-cafe p-8 text-maiz lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(224,122,44,0.18),transparent_45%)]" />
              <div className="relative">
                <h3 className="mb-6 text-[13px] font-bold uppercase tracking-[0.14em] text-achiote">Combos</h3>
                <Combo name="Completo" desc="Sopa · Seco · Jugo · Postre" price={MENU_HOY.precios.completo} featured />
                <Combo name="Sin sopa" desc="Seco · Jugo · Postre" price={MENU_HOY.precios.sinSopa} />
                <Combo name="Sin postre" desc="Sopa · Seco · Jugo" price={MENU_HOY.precios.sinPostre} />
                <Combo name="Básico" desc="Seco · Jugo" price={MENU_HOY.precios.basico} />
                <button className="mt-8 w-full rounded-md bg-achiote px-5 py-3 font-semibold text-cafe hover:bg-achiote/90">
                  Armar pedido
                </button>
                <p className="mt-3 text-center text-xs text-maiz/60">
                  Domicilio calculado según kilómetros o pago contra entrega.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="especiales" className="mx-auto max-w-6xl px-6 pb-20">
          <SectionHead
            eyebrow="Especiales"
            title="Para salirte del corrientazo"
            subtitle="Platos de precio individual, con unidades limitadas para hoy."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {ESPECIALES.map((plato, index) => (
              <article key={plato.nombre} className="overflow-hidden rounded-2xl border border-maiz-3 bg-elevated shadow-warm-sm">
                <div
                  className={[
                    "flex h-36 items-center justify-center bg-gradient-to-br font-heading text-5xl font-extrabold text-maiz",
                    index === 0 ? "from-achiote to-rojo-ladrillo" : index === 1 ? "from-platano to-achiote-dark" : "from-cafe-3 to-cafe",
                  ].join(" ")}
                >
                  {plato.inicial}
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <h3 className="font-heading text-xl font-extrabold text-cafe">{plato.nombre}</h3>
                    <p className="font-heading text-lg font-extrabold text-rojo-ladrillo">{formatCOP(plato.precio)}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-cafe-2">{plato.detalle}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-maiz-3 bg-[#2A1810] text-maiz">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-achiote/25 bg-achiote/10 text-achiote">
                <svg width="23" height="23" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M18.8 4.2c2 2.1 1.9 5.4-.2 7.4l-4.1 3.9 2.8 2.9 4.1-3.9c3.7-3.5 3.8-9.3.3-12.9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M12 15.7l4.2 4.4-8.4 8.1a3 3 0 01-4.2-.1 3 3 0 01.1-4.2l8.3-8.2z" fill="currentColor" opacity=".9" />
                </svg>
              </span>
              <div>
                <p className="font-heading text-xl font-extrabold leading-none">La Cuchara</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-maiz/50">Corrientazo casero</p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-maiz/65">
              Cocina oculta colombiana con pedidos para recoger, domicilio y pagos en línea.
            </p>
          </div>

          <FooterGroup title="Carta">
            <a href="#menu">Menú del día</a>
            <a href="#especiales">Platos especiales</a>
            <a href="#pedido">Armar pedido</a>
          </FooterGroup>

          <FooterGroup title="Acceso">
            <Link href="/auth?mode=login&role=cliente">Cliente</Link>
            <Link href="/auth?mode=login&role=empleado">Empleado</Link>
            <Link href="/auth?mode=login&role=admin">Administrador</Link>
          </FooterGroup>

          <div>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-achiote">Servicio</h3>
            <p className="text-sm text-maiz/65">Lunes a sábado</p>
            <p className="mt-1 font-heading text-lg font-bold">11:30 a.m. - 3:30 p.m.</p>
            <p className="mt-3 text-sm text-maiz/65">Domicilios calculados por kilómetros.</p>
          </div>
        </div>
        <div className="border-t border-maiz/10 px-6 py-4 text-center text-xs text-maiz/45">
          La Cuchara · Sistema académico de administración para corrientazo colombiano
        </div>
      </footer>
    </div>
  );
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-achiote">{title}</h3>
      <div className="flex flex-col gap-2 text-sm text-maiz/65 [&_a:hover]:text-maiz">
        {children}
      </div>
    </div>
  );
}

function HeroMeta({ label, value, dot }: { label: string; value: string; dot?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-cafe-3">{label}</p>
      <p className="font-heading text-lg font-bold text-cafe">
        {dot && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-hoja shadow-[0_0_0_3px_rgba(92,122,58,0.2)]" />}
        {value}
      </p>
    </div>
  );
}

function SectionHead({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-9">
      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-achiote-dark before:h-0.5 before:w-6 before:bg-achiote">
        {eyebrow}
      </p>
      <h2 className="font-heading text-4xl font-extrabold leading-tight text-cafe">{title}</h2>
      <p className="mt-2 max-w-2xl text-base text-cafe-2">{subtitle}</p>
    </div>
  );
}

function Course({ number, title, desc, children }: { number: string; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-dashed border-maiz-3 py-4 last:border-b-0">
      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rojo-ladrillo font-heading text-sm font-bold text-maiz">
        {number}
      </span>
      <div>
        <h4 className="font-heading text-lg font-bold text-cafe">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-cafe-2">{desc}</p>
        {children}
      </div>
    </div>
  );
}

function Combo({ name, desc, price, featured }: { name: string; desc: string; price: number; featured?: boolean }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-dashed border-maiz/15 py-4 last:border-b-0">
      <div className="flex-1">
        <p className={featured ? "font-heading text-xl font-extrabold text-achiote" : "font-heading text-xl font-bold text-maiz"}>
          {name}
          {featured && (
            <span className="ml-2 rounded-full bg-achiote px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-cafe">
              Más pedido
            </span>
          )}
        </p>
        <p className="mt-1 text-sm text-maiz/60">{desc}</p>
      </div>
      <p className="font-heading text-2xl font-extrabold text-maiz">{formatCOP(price)}</p>
    </div>
  );
}
