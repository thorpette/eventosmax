import { useMemo, useState } from "react";
import { api } from "../api/client";
import type { Client, Event, OrderResponse, TicketType } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import { ProcessTracker, type StepState } from "../components/ProcessTracker";
import { SectionCard, inputClass, labelClass, primaryButton, secondaryButton } from "../components/ui";

interface AvailabilityResponse {
  eventId: string;
  disponibilidad: boolean;
  sectors: Array<{
    ticketTypeId: string;
    name: string;
    category: "GENERAL" | "VIP";
    capacity: number;
    sold: number;
    available: number;
    status: "AVAILABLE" | "LOW" | "SOLD_OUT";
  }>;
}

/**
 * Screen: "PassLive - Proceso de Venta de Entradas"
 * BPMN: Proceso_de_Venta_de_Entradas (Process_2).
 */
export function SalesPage() {
  const eventsState = useAsync(() => api<{ items: Event[] }>("/sales/events"));
  const clientsState = useAsync(() => api<{ items: Client[] }>("/clients"));

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResponse | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedEvent = useMemo(
    () => eventsState.data?.items.find((e) => e.id === selectedEventId) ?? null,
    [eventsState.data, selectedEventId],
  );

  async function checkAvailability(eventId: string) {
    try {
      const result = await api<AvailabilityResponse>(`/sales/events/${eventId}/availability`);
      setAvailability(result);
      setMessage(
        result.disponibilidad
          ? { kind: "ok", text: "Gateway evaluado: DISPONIBLE (continúa la venta)" }
          : { kind: "error", text: "Gateway evaluado: NO DISPONIBLE (notificar falta)" },
      );
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error" });
    }
  }

  function selectEvent(event: Event) {
    setSelectedEventId(event.id);
    setAvailability(null);
    setOrderResult(null);
    setQuantities({});
    void checkAvailability(event.id);
  }

  function changeQuantity(ticketTypeId: string, delta: number) {
    setQuantities((prev) => {
      const current = prev[ticketTypeId] ?? 0;
      const next = Math.max(0, Math.min(6, current + delta));
      return { ...prev, [ticketTypeId]: next };
    });
  }

  async function completePurchase() {
    if (!selectedEvent || !selectedClientId) {
      setMessage({ kind: "error", text: "Seleccione evento y cliente antes de completar la compra." });
      return;
    }
    const lines = (selectedEvent.ticketTypes ?? [])
      .map((t) => ({ ticketTypeId: t.id, quantity: quantities[t.id] ?? 0 }))
      .filter((l) => l.quantity > 0);
    if (lines.length === 0) {
      setMessage({ kind: "error", text: "Seleccione al menos una entrada." });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const client = clientsState.data?.items.find((c) => c.id === selectedClientId);
      const result = await api<OrderResponse>("/sales/orders", {
        method: "POST",
        body: {
          eventId: selectedEvent.id,
          clientId: selectedClientId,
          lines,
          holderName: client?.name ?? "Titular",
          holderDni: client?.dni ?? "000000000",
          ageVerified: true,
          localId: selectedEvent.venueId,
        },
      });
      setOrderResult(result);
      setMessage({
        kind: "ok",
        text: `Compra completada: ${result.tickets.length} entradas emitidas y enviadas al cliente`,
      });
      eventsState.reload();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error en la compra" });
    } finally {
      setBusy(false);
    }
  }

  const trackerSteps: Array<{ label: string; detail: string; state?: StepState }> = [
    { label: "Cliente inicia compra", detail: "Inicio", state: "done" as const },
    { label: "Seleccionar evento", detail: selectedEvent ? selectedEvent.name : "Pendiente", state: selectedEvent ? ("done" as const) : ("active" as const) },
    { label: "¿Hay disponibilidad?", detail: availability ? (availability.disponibilidad ? "Sí" : "No") : "Evaluar", state: availability ? (availability.disponibilidad ? "done" : "error") : "idle" },
    { label: "Elegir cantidad y tipo", detail: "VIP / General", state: availability?.disponibilidad ? ("active" as const) : ("idle" as const) },
    { label: "Procesar pago", detail: orderResult?.order.reference ?? "Pendiente", state: orderResult ? ("done" as const) : ("idle" as const) },
    { label: "Compra completada", detail: orderResult ? "Dual Pass Emitido" : "Pendiente", state: orderResult ? ("done" as const) : ("idle" as const) },
  ];

  return (
    <div>
      <ProcessTracker
        processId="PROCESS_2"
        title="Flujo Operativo: Proceso de Venta y Emisión de Entradas"
        subtitle="Protocolo Verde Mate v1.2: Selección de cupo, validación de disponibilidad y generación de credenciales duales."
        steps={trackerSteps}
      />

      {message ? (
        <div
          className={`mb-6 p-4 rounded-xl border text-body-sm font-body-sm ${
            message.kind === "ok"
              ? "bg-primary-container/20 border-primary/40 text-primary"
              : "bg-error-container/30 border-error/40 text-error"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <SectionCard
            title="Seleccionar Evento"
            step="1"
            action={
              <span className="text-label-mono-sm font-label-mono-sm text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">sync</span>
                Telemetría de aforo en vivo
              </span>
            }
          >
            {eventsState.loading ? (
              <p className="text-body-sm text-on-surface-variant">Cargando eventos…</p>
            ) : eventsState.error ? (
              <p className="text-body-sm text-error">{eventsState.error}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(eventsState.data?.items ?? []).map((event) => {
                  const selected = event.id === selectedEventId;
                  const available = event.availability?.available;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => selectEvent(event)}
                      className={`p-4 rounded-xl text-left cursor-pointer transition-all ${
                        selected
                          ? "border-2 border-primary bg-primary-container/10"
                          : "border border-outline-variant/40 bg-surface-container hover:border-outline opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-label-mono-sm font-label-mono-sm px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-semibold">
                          {selected ? "SELECCIONADO" : available === false ? "AGOTADO" : "DISPONIBLE"}
                        </span>
                      </div>
                      <h3 className="text-body-md font-body-md font-bold text-on-surface mt-2.5">
                        {event.name}
                      </h3>
                      <p className="text-body-sm font-body-sm text-on-surface-variant">{event.code}</p>
                      <div className="mt-3 pt-3 border-t border-outline-variant/30 flex justify-between text-label-mono-sm font-label-mono-sm text-outline">
                        <span>{event.date}</span>
                        <span>
                          {event.startTime}h - {event.endTime}h
                        </span>
                      </div>
                    </button>
                  );
                })}
                {(eventsState.data?.items.length ?? 0) === 0 ? (
                  <p className="text-body-sm text-on-surface-variant">
                    No hay eventos publicados. Cree uno en la pestaña Eventos.
                  </p>
                ) : null}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Punto de Decisión: Estado de Disponibilidad por Sector"
            step="?"
            action={
              <span className="px-2.5 py-1 rounded bg-surface-container text-label-mono-sm font-label-mono-sm text-primary border border-outline-variant/40">
                GATEWAY EVALUADO: {availability ? (availability.disponibilidad ? "POSITIVO" : "NEGATIVO") : "PENDIENTE"}
              </span>
            }
          >
            {!availability ? (
              <p className="text-body-sm text-on-surface-variant">
                Seleccione un evento para evaluar el gateway de disponibilidad (Task_3).
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {availability.sectors.map((sector) => (
                  <div
                    key={sector.ticketTypeId}
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      sector.status === "SOLD_OUT"
                        ? "bg-surface-container-high/60 border-error-container/40"
                        : "bg-surface-container border-outline-variant/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            sector.status === "SOLD_OUT"
                              ? "bg-error"
                              : sector.category === "VIP"
                                ? "bg-tertiary"
                                : "bg-secondary"
                          }`}
                        />
                        <span className="text-body-md font-body-md font-semibold text-on-surface">
                          {sector.name}
                        </span>
                      </div>
                      <div className="text-label-mono-sm font-label-mono-sm text-outline mt-1">
                        Disponible: {sector.available} entradas
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-label-mono-sm font-label-mono-sm font-semibold ${
                        sector.status === "SOLD_OUT"
                          ? "bg-error-container text-on-error-container"
                          : sector.status === "LOW"
                            ? "bg-tertiary/20 text-tertiary border border-tertiary/40"
                            : "bg-primary-container/30 text-primary border border-primary/40"
                      }`}
                    >
                      {sector.status === "SOLD_OUT" ? "AGOTADO" : sector.status === "LOW" ? "ÚLTIMAS" : "ABIERTO"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Elegir Cantidad y Tipo de Entrada"
            step="2"
            action={<span className="text-body-sm font-body-sm text-on-surface-variant">Máx. 6 pases por transacción</span>}
          >
            {!selectedEvent ? (
              <p className="text-body-sm text-on-surface-variant">Seleccione primero un evento.</p>
            ) : (
              <div className="space-y-4">
                {(selectedEvent.ticketTypes ?? []).map((ticketType: TicketType) => (
                  <div
                    key={ticketType.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      ticketType.category === "VIP"
                        ? "border-2 border-tertiary/60 bg-surface-container"
                        : "border border-primary/40 bg-surface-container"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-label-mono-sm font-label-mono-sm font-semibold ${
                            ticketType.category === "VIP"
                              ? "bg-tertiary-container text-on-tertiary-container border border-tertiary/50"
                              : "bg-primary-container text-on-primary-container"
                          }`}
                        >
                          {ticketType.category === "VIP" ? "VIP GOLD" : "GENERAL"}
                        </span>
                        <h3
                          className={`text-body-lg font-body-lg font-semibold ${
                            ticketType.category === "VIP" ? "text-tertiary" : "text-on-surface"
                          }`}
                        >
                          {ticketType.name}
                        </h3>
                      </div>
                      <div className="text-title-md font-title-md font-bold text-on-surface">
                        {ticketType.price.toFixed(2)} €{" "}
                        <span className="text-label-mono-sm font-label-mono-sm text-outline font-normal">
                          + {ticketType.fees.toFixed(2)} € gastos
                        </span>
                      </div>
                      <div className="text-label-mono-sm font-label-mono-sm text-outline">
                        Vendidas: {ticketType.sold} / {ticketType.capacity}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/40 self-start md:self-auto">
                      <button
                        type="button"
                        aria-label="Disminuir"
                        className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
                        onClick={() => changeQuantity(ticketType.id, -1)}
                      >
                        <span className="material-symbols-outlined text-base">remove</span>
                      </button>
                      <span className="font-label-mono-lg text-label-mono-lg text-on-surface w-6 text-center font-bold">
                        {quantities[ticketType.id] ?? 0}
                      </span>
                      <button
                        type="button"
                        aria-label="Aumentar"
                        className="w-9 h-9 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary transition-colors"
                        onClick={() => changeQuantity(ticketType.id, 1)}
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <h2 className="text-title-md font-title-md text-on-surface font-semibold">
                Resumen de Venta
              </h2>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className={labelClass}>CLIENTE (Task_2)</label>
                <select
                  className={inputClass}
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Seleccione un cliente…</option>
                  {(clientsState.data?.items ?? []).map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.dni})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-outline-variant/30">
                {(selectedEvent?.ticketTypes ?? []).map((t) => {
                  const qty = quantities[t.id] ?? 0;
                  if (qty === 0) return null;
                  return (
                    <div key={t.id} className="flex justify-between items-center text-body-md font-body-md">
                      <span className={t.category === "VIP" ? "text-tertiary" : "text-on-surface"}>
                        {qty}x {t.name}
                      </span>
                      <span className="font-label-mono-md font-semibold text-on-surface">
                        {(t.price * qty).toFixed(2)} €
                      </span>
                    </div>
                  );
                })}
                {!selectedEvent ||
                Object.values(quantities).every((q) => q === 0) ? (
                  <p className="text-body-sm text-on-surface-variant">Sin entradas seleccionadas.</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                className={`${primaryButton} w-full h-12`}
                disabled={busy}
                onClick={() => void completePurchase()}
              >
                <span className="material-symbols-outlined text-xl">task_alt</span>
                <span>{busy ? "Procesando…" : "Completar Compra y Emitir Pases"}</span>
              </button>
            </div>

            {orderResult ? (
              <div className="mt-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60">
                <div className="text-label-mono-sm font-label-mono-sm text-primary font-bold mb-2">
                  PASES EMITIDOS
                </div>
                {orderResult.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="font-label-mono-sm text-label-mono-sm text-on-surface-variant flex justify-between py-1 border-b border-outline-variant/30 last:border-0"
                  >
                    <span>{ticket.qrCode}</span>
                    <span className={ticket.type === "VIP" ? "text-tertiary" : "text-secondary"}>
                      {ticket.type}
                    </span>
                  </div>
                ))}
                <div className="mt-2 font-label-mono-sm text-label-mono-sm text-outline">
                  Ref: {orderResult.order.reference} · Total: {orderResult.order.total.toFixed(2)} €
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-surface-container-low border border-error-container/40 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-md bg-error-container text-on-error-container flex items-center justify-center font-label-mono-sm text-xs font-bold">
                !
              </span>
              <h2 className="text-title-md font-title-md text-on-surface font-semibold">
                Notificar Falta de Disponibilidad
              </h2>
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-4">
              Si el sector está agotado (gateway negativo), registre al solicitante en la lista de
              espera (Task_4).
            </p>
            <WaitlistForm eventId={selectedEventId} onDone={(text) => setMessage({ kind: "ok", text })} />
          </div>
        </div>
      </div>
    </div>
  );
}

function WaitlistForm({
  eventId,
  onDone,
}: {
  eventId: string;
  onDone: (text: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!eventId) {
      onDone("Seleccione un evento antes de registrar la lista de espera.");
      return;
    }
    setBusy(true);
    try {
      await api("/sales/waitlist", { method: "POST", body: { eventId, name, email, phone } });
      onDone("Solicitante registrado en lista de espera; se notificará al liberar aforo.");
      setName("");
      setEmail("");
      setPhone("");
    } catch (err) {
      onDone(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <input className={inputClass} placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={inputClass} placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={inputClass} placeholder="+34 600 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <button type="button" className={`${secondaryButton} py-2.5`} disabled={busy} onClick={() => void submit()}>
        <span className="material-symbols-outlined text-sm">notification_add</span>
        <span>Avisar Liberación</span>
      </button>
    </div>
  );
}
