import { NavLink, Outlet, useLocation } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  badge?: string;
}

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Operativa",
    items: [
      { to: "/", label: "Venta de Entradas", icon: "confirmation_number", badge: "PROCESO 1" },
      { to: "/validacion", label: "Validación en Acceso", icon: "qr_code_scanner" },
      { to: "/restricciones", label: "Control de Accesos", icon: "policy" },
      { to: "/colaboracion", label: "Sincronización Locales", icon: "sync_alt" },
    ],
  },
  {
    title: "Administración",
    items: [
      { to: "/eventos", label: "Eventos", icon: "calendar_today" },
      { to: "/locales", label: "Locales", icon: "location_on" },
      { to: "/clientes", label: "Clientes", icon: "group" },
      { to: "/entradas", label: "Entradas", icon: "ticket" },
    ],
  },
];

/**
 * Shell compartido extraído de las pantallas Stitch:
 * TopNavBar (header sticky) + SideNavBar (aside w-64).
 */
export function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 py-3 border-b border-outline-variant/40 bg-surface-container-low">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center ring-2 ring-primary/40 shadow-inner">
              <span className="material-symbols-outlined text-surface-container-lowest">
                confirmation_number
              </span>
            </div>
            <span className="tracking-tight text-on-surface font-title-md text-title-md font-bold">
              Pass<span className="text-primary">Live</span>
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-mono-sm font-label-mono-sm bg-surface-container text-on-surface-variant border border-outline-variant/40">
            v1.2 Verde Mate
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-primary-container/20 border border-primary/30 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
            </span>
            <span className="text-label-mono-sm font-label-mono-sm text-primary">
              Dual: BLE + QR Activo
            </span>
          </div>
          <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/40">
            <span className="material-symbols-outlined text-primary text-sm">
              bluetooth_searching
            </span>
            <span className="text-label-mono-sm font-label-mono-sm text-on-surface font-semibold">
              Terminal Turnstile #04
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/60 flex items-center justify-center text-primary font-label-mono-sm font-semibold">
            OP
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 flex-shrink-0 bg-surface-container-low border-r border-outline-variant/40 flex flex-col justify-between p-4 hidden md:flex">
          <div className="space-y-6">
            <div className="px-2 pt-1 pb-2 border-b border-outline-variant/20">
              <div className="text-title-md font-title-md font-bold text-on-surface flex items-center justify-between">
                <span>PassLive</span>
                <span className="text-xs px-2 py-0.5 rounded bg-primary-container/40 text-on-primary-container font-label-mono-sm">
                  LIVE
                </span>
              </div>
              <div className="text-label-mono-sm font-label-mono-sm text-outline mt-0.5">
                Terminal Turnstile #04
              </div>
            </div>

            <nav className="space-y-6">
              {NAV_GROUPS.map((group) => (
                <div key={group.title}>
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-3 mb-2">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active =
                        item.to === "/"
                          ? location.pathname === "/"
                          : location.pathname.startsWith(item.to);
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={
                            active
                              ? "flex items-center justify-between bg-primary-container/20 text-primary border-l-2 border-primary px-4 py-3 font-semibold rounded-r-lg transition-all"
                              : "flex items-center gap-3 text-on-surface-variant px-4 py-3 rounded-lg hover:bg-surface-container hover:text-on-surface transition-colors"
                          }
                        >
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="text-body-md font-body-md">{item.label}</span>
                          </div>
                          {item.badge ? (
                            <span className="px-1.5 py-0.5 rounded text-label-mono-sm font-label-mono-sm bg-primary-container text-on-primary-container">
                              {item.badge}
                            </span>
                          ) : null}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="space-y-4 pt-4 border-t border-outline-variant/40">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-on-surface-variant px-4 py-2 rounded-lg text-body-sm font-body-sm">
                <span className="material-symbols-outlined text-lg">settings</span>
                <span>Configuración</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
