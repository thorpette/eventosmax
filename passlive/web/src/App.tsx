import { Route, Routes } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { SalesPage } from "./pages/SalesPage";
import { ValidationPage } from "./pages/ValidationPage";
import { AccessRestrictionsPage } from "./pages/AccessRestrictionsPage";
import { CollaborationPage } from "./pages/CollaborationPage";
import { EventsPage } from "./pages/EventsPage";
import { VenuesPage } from "./pages/VenuesPage";
import { ClientsPage } from "./pages/ClientsPage";
import { TicketsPage } from "./pages/TicketsPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<SalesPage />} />
        <Route path="/validacion" element={<ValidationPage />} />
        <Route path="/restricciones" element={<AccessRestrictionsPage />} />
        <Route path="/colaboracion" element={<CollaborationPage />} />
        <Route path="/eventos" element={<EventsPage />} />
        <Route path="/locales" element={<VenuesPage />} />
        <Route path="/clientes" element={<ClientsPage />} />
        <Route path="/entradas" element={<TicketsPage />} />
      </Route>
    </Routes>
  );
}
