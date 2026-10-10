import { useState } from "react";
import { api } from "../api/client";
import type { Client, Event, Ticket } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import { SectionCard, inputClass, labelClass, primaryButton, secondaryButton, errorButton } from "../components/ui";

/**
 * Screen: "Gestión de Entrada - PassLive Verde Mate"
 * BPMN: Gestion_de_Entrada (Alta / Consulta / Edición / Baja).
 */
export function TicketsPage() {
  const ticketsState = useAsync(() => api<{ items: Ticket[] }>("/tickets"));
  const eventsState = useAsync(() => api<{ items: Event[] }>("/events"));
  const clientsState = useAsync(() => api<{ items: Client[] }>("/clients"));
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const [altaForm, setAltaForm] = useState({
    type: "VIP" as "GENERAL" | "VIP",
    eventId: "",
    clientId: "",
    localId: "",
  });

  const [editTarget, setEditTarget] = useState<Ticket | null>(null);
  const [editType, setEditType] = useState<"GENERAL" | "VIP">("GENERAL");
  const [editStatus, setEditStatus] = useState<Ticket["status"]>("VALID");
  const [editNote, setEditNote] = useState("");

  const [bajaTarget, setBajaTarget] = useState<Ticket | null>(null);
  const [bajaConfirm, setBajaConfirm] = useState(false);

  async function alta() {
    setBusy(true);
    setMessage(null);
    try {
      const ticket = await api<Ticket>("/tickets", {
        method: "POST",
        body: {
          type: altaForm.type,
          eventId: altaForm.eventId,
          clientId: altaForm.clientId,
          localId: altaForm.localId || null,
        },
      });
      setMessage({
        kind: "ok",
        text: `Entrada registrada con QR ${ticket.qrCode} y token BLE (estado VÁLIDA).`,
      });
      ticketsState.reload();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function guardarEdicion() {
    if (!editTarget) return;
    setBusy(true);
    try {
      await api(`/tickets/${editTarget.id}`, {
        method: "PUT",
        body: { type: editType, status: editStatus },
      });
      setMessage({ kind: "ok", text: `Entrada actualizada. Nota: ${editNote || "—"} ` });
      setEditTarget(null);
      ticketsState.reload();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function confirmarBaja() {
    if (!bajaTarget) return;
    setBusy(true);
    try {
      await api(`/tickets/${bajaTarget.id}`, { method: "DELETE" });
      setMessage({
        kind: "ok",
        text: "Entrada invalidada: código QR y validación Bluetooth desactivados.",
      });
      setBajaTarget(null);
      setBajaConfirm(false);
      ticketsState.reload();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  const filtered = (ticketsState.data?.items ?? []).filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return t.qrCode.toLowerCase().includes(q) || t.bleToken.toLowerCase().includes(q);
  });

  return (
    <div>
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

      <SectionCard title="Registrar nueva Entrada (Alta)" step="A">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>EVENTO</label>
            <select
              className={inputClass}
              value={altaForm.eventId}
              onChange={(e) => setAltaForm({ ...altaForm, eventId: e.target.value })}
            >
              <option value="">Seleccione…</option>
              {(eventsState.data?.items ?? []).map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>CLIENTE</label>
            <select
              className={inputClass}
              value={altaForm.clientId}
              onChange={(e) => setAltaForm({ ...altaForm, clientId: e.target.value })}
            >
              <option value="">Seleccione…</option>
              {(clientsState.data?.items ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>TIPO</label>
            <div className="flex gap-3 h-10 items-center">
              <label className="flex items-center gap-2 text-body-sm text-on-surface cursor-pointer">
                <input
                  type="radio"
                  name="tipoEntrada"
                  checked={altaForm.type === "GENERAL"}
                  onChange={() => setAltaForm({ ...altaForm, type: "GENERAL" })}
                />
                General
              </label>
              <label className="flex items-center gap-2 text-body-sm text-on-surface cursor-pointer">
                <input
                  type="radio"
                  name="tipoEntrada"
                  checked={altaForm.type === "VIP"}
                  onChange={() => setAltaForm({ ...altaForm, type: "VIP" })}
                />
                VIP Gold
              </label>
            </div>
          </div>
          <div>
            <label className={labelClass}>LOCAL DESTINO (OPCIONAL)</label>
            <input
              className={inputClass}
              value={altaForm.localId}
              onChange={(e) => setAltaForm({ ...altaForm, localId: e.target.value })}
              placeholder="ID del local"
            />
          </div>
        </div>
        <button
          type="button"
          className={`${primaryButton} h-11 px-5 mt-5`}
          disabled={busy || !altaForm.eventId || !altaForm.clientId}
          onClick={() => void alta()}
        >
          <span className="material-symbols-outlined text-lg">add_task</span>
          Generar QR, asignar tipo y establecer estado Válida
        </button>
      </SectionCard>

      <SectionCard
        title="Consultar Entrada"
        step="C"
        action={
          <input
            className="w-64 bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-body-sm text-on-surface focus:border-primary outline-none"
            placeholder="Buscar por código QR o token BLE…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      >
        {ticketsState.loading ? (
          <p className="text-body-sm text-on-surface-variant">Cargando…</p>
        ) : ticketsState.error ? (
          <p className="text-body-sm text-error">{ticketsState.error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm font-body-sm">
              <thead>
                <tr className="text-left text-label-mono-sm font-label-mono-sm text-outline border-b border-outline-variant/40">
                  <th className="py-2 pr-3">CÓDIGO QR</th>
                  <th className="py-2 pr-3">TOKEN BLE</th>
                  <th className="py-2 pr-3">TIPO</th>
                  <th className="py-2 pr-3">ESTADO</th>
                  <th className="py-2 pr-3">COMPRA</th>
                  <th className="py-2 pr-3">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-outline-variant/20 text-on-surface">
                    <td className="py-2 pr-3 font-mono text-xs">{ticket.qrCode}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{ticket.bleToken.slice(0, 18)}…</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded text-label-mono-sm font-label-mono-sm ${
                          ticket.type === "VIP"
                            ? "bg-tertiary-container text-on-tertiary-container"
                            : "bg-primary-container text-on-primary-container"
                        }`}
                      >
                        {ticket.type}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{ticket.status}</td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {ticket.purchaseDate.slice(0, 10)}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => {
                            setEditTarget(ticket);
                            setEditType(ticket.type);
                            setEditStatus(ticket.status);
                            setEditNote("");
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-error hover:underline"
                          onClick={() => setBajaTarget(ticket)}
                        >
                          Baja
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant mt-3">Sin entradas registradas.</p>
            ) : null}
          </div>
        )}
      </SectionCard>

      {editTarget ? (
        <SectionCard title="Editar Entrada" step="E">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>TIPO (VIP / GENERAL)</label>
              <select
                className={inputClass}
                value={editType}
                onChange={(e) => setEditType(e.target.value as typeof editType)}
              >
                <option value="GENERAL">General</option>
                <option value="VIP">VIP Gold</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>ESTADO</label>
              <select
                className={inputClass}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as Ticket["status"])}
              >
                <option value="VALID">Válida</option>
                <option value="INVALID">Inválida</option>
                <option value="USED">Utilizada</option>
                <option value="DENIED">Denegada</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>NOTA / MOTIVO</label>
              <input
                className={inputClass}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Upgrade de cortesía, reubicación…"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              type="button"
              className={`${primaryButton} h-11 px-5`}
              disabled={busy}
              onClick={() => void guardarEdicion()}
            >
              <span className="material-symbols-outlined text-lg">save</span>
              Guardar cambios
            </button>
            <button type="button" className={`${secondaryButton} h-11 px-5`} onClick={() => setEditTarget(null)}>
              Cancelar
            </button>
          </div>
        </SectionCard>
      ) : null}

      {bajaTarget ? (
        <SectionCard title="Dar de baja Entrada" step="B">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>CÓDIGO QR A INVALIDAR</label>
              <input className={`${inputClass} font-mono text-error`} value={bajaTarget.qrCode} readOnly />
            </div>
            <div>
              <label className={labelClass}>CONFIRMACIÓN</label>
              <label className="flex items-center gap-2 h-10 text-body-sm text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={bajaConfirm}
                  onChange={(e) => setBajaConfirm(e.target.checked)}
                />
                Confirmo la invalidación del ticket y la revocación del QR/BLE
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              type="button"
              className={`${errorButton} h-11 px-5`}
              disabled={busy || !bajaConfirm}
              onClick={() => void confirmarBaja()}
            >
              <span className="material-symbols-outlined text-lg">cancel</span>
              Invalidar entrada y desactivar QR + Bluetooth
            </button>
            <button
              type="button"
              className={`${secondaryButton} h-11 px-5`}
              onClick={() => {
                setBajaTarget(null);
                setBajaConfirm(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
