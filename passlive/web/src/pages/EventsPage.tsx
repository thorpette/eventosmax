import { useState } from "react";
import { api } from "../api/client";
import type { Event, Venue } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import { SectionCard, inputClass, labelClass, primaryButton, secondaryButton } from "../components/ui";

/**
 * Screen: "Gestión de Evento - Consola PassLive"
 * BPMN: Gestion_de_Evento (Alta / Consulta / Edición / Baja).
 */
export function EventsPage() {
  const eventsState = useAsync(() => api<{ items: Event[] }>("/events"));
  const venuesState = useAsync(() => api<{ items: Venue[] }>("/venues"));
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    date: "2026-07-18",
    startTime: "21:00",
    endTime: "04:30",
    venueId: "",
    ageRestriction: "OVER_18",
    capacity: 2000,
    basePrice: 45,
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("PUBLISHED");

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      if (editId) {
        await api(`/events/${editId}`, { method: "PUT", body: { status: editStatus } });
        setMessage({ kind: "ok", text: "Evento actualizado (Edición)." });
      } else {
        await api("/events", { method: "POST", body: form });
        setMessage({ kind: "ok", text: "Evento creado y con tipologías por defecto (Alta)." });
      }
      setEditId(null);
      eventsState.reload();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await api(`/events/${id}`, { method: "DELETE" });
      setMessage({ kind: "ok", text: "Evento dado de baja." });
      eventsState.reload();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

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

      <SectionCard title={editId ? "Edición de Evento" : "Alta de Evento"} step={editId ? "E" : "A"}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>NOMBRE DEL EVENTO</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nocturna Sound Wave: Festival Electrónico"
            />
          </div>
          <div>
            <label className={labelClass}>CÓDIGO</label>
            <input
              className={`${inputClass} uppercase font-mono`}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="ERP-NOCT-5582"
            />
          </div>
          <div>
            <label className={labelClass}>LOCAL</label>
            <select
              className={inputClass}
              value={form.venueId}
              onChange={(e) => setForm({ ...form, venueId: e.target.value })}
            >
              <option value="">Seleccione un local…</option>
              {(venuesState.data?.items ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>FECHA</label>
            <input
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>HORA INICIO</label>
            <input
              type="time"
              className={inputClass}
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>HORA FIN</label>
            <input
              type="time"
              className={inputClass}
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>RESTRICCIÓN DE EDAD</label>
            <select
              className={inputClass}
              value={form.ageRestriction}
              onChange={(e) =>
                setForm({ ...form, ageRestriction: e.target.value as typeof form.ageRestriction })
              }
            >
              <option value="NONE">Sin restricción</option>
              <option value="OVER_18">+18 (Mayores de edad)</option>
              <option value="OVER_21">+21</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>CAPACIDAD</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass}>PRECIO BASE (€)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
            />
          </div>

          {editId ? (
            <div>
              <label className={labelClass}>ESTADO</label>
              <select
                className={inputClass}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicado</option>
                <option value="CANCELLED">Cancelado</option>
                <option value="FINISHED">Finalizado</option>
              </select>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            className={`${primaryButton} h-11 px-5`}
            disabled={busy || !form.venueId || (!editId && !form.name)}
            onClick={() => void submit()}
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {editId ? "Guardar cambios" : "Crear evento"}
          </button>
          {editId ? (
            <button type="button" className={`${secondaryButton} h-11 px-5`} onClick={() => setEditId(null)}>
              Cancelar edición
            </button>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Consulta de Evento" step="C">
        {eventsState.loading ? (
          <p className="text-body-sm text-on-surface-variant">Cargando…</p>
        ) : eventsState.error ? (
          <p className="text-body-sm text-error">{eventsState.error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm font-body-sm">
              <thead>
                <tr className="text-left text-label-mono-sm font-label-mono-sm text-outline border-b border-outline-variant/40">
                  <th className="py-2 pr-3">NOMBRE</th>
                  <th className="py-2 pr-3">CÓDIGO</th>
                  <th className="py-2 pr-3">FECHA</th>
                  <th className="py-2 pr-3">LOCAL</th>
                  <th className="py-2 pr-3">RESTRICCIÓN</th>
                  <th className="py-2 pr-3">ESTADO</th>
                  <th className="py-2 pr-3">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {(eventsState.data?.items ?? []).map((event) => (
                  <tr key={event.id} className="border-b border-outline-variant/20 text-on-surface">
                    <td className="py-2 pr-3 font-semibold">{event.name}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{event.code}</td>
                    <td className="py-2 pr-3">{event.date}</td>
                    <td className="py-2 pr-3">{event.venueId.slice(0, 8)}</td>
                    <td className="py-2 pr-3">{event.ageRestriction}</td>
                    <td className="py-2 pr-3">{event.status}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => {
                            setEditId(event.id);
                            setEditStatus(event.status);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-error hover:underline"
                          onClick={() => void remove(event.id)}
                        >
                          Baja
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(eventsState.data?.items.length ?? 0) === 0 ? (
              <p className="text-body-sm text-on-surface-variant mt-3">Sin eventos registrados.</p>
            ) : null}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
