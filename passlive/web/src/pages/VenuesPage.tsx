import { useState } from "react";
import { api } from "../api/client";
import type { Venue } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import { SectionCard, inputClass, labelClass, primaryButton, secondaryButton } from "../components/ui";

/**
 * Screen: "Gestión de Local - PassLive"
 * BPMN: Gestion_de_Local (Alta / Consulta / Edición / Baja).
 */
export function VenuesPage() {
  const venuesState = useAsync(() => api<{ items: Venue[] }>("/venues"));
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    license: "",
    address: "",
    city: "Madrid",
    maxCapacity: 2400,
    capacityPercent: 85,
    rssiThreshold: -65,
    qrRotationSeconds: 15,
    validationTechnology: "DUAL" as Venue["validationTechnology"],
    status: "ACTIVE" as Venue["status"],
  });

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      if (editId) {
        await api(`/venues/${editId}`, { method: "PUT", body: form });
        setMessage({ kind: "ok", text: "Local actualizado (Edición)." });
      } else {
        await api("/venues", { method: "POST", body: form });
        setMessage({ kind: "ok", text: "Local creado (Alta)." });
      }
      setEditId(null);
      venuesState.reload();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await api(`/venues/${id}`, { method: "DELETE" });
      setMessage({ kind: "ok", text: "Local dado de baja." });
      venuesState.reload();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  function startEdit(venue: Venue) {
    setEditId(venue.id);
    setForm({
      name: venue.name,
      license: venue.license,
      address: venue.address,
      city: venue.city,
      maxCapacity: venue.maxCapacity,
      capacityPercent: venue.capacityPercent,
      rssiThreshold: venue.rssiThreshold,
      qrRotationSeconds: venue.qrRotationSeconds,
      validationTechnology: venue.validationTechnology,
      status: venue.status,
    });
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

      <SectionCard title={editId ? "Edición de Local" : "Alta de Local"} step={editId ? "E" : "A"}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>NOMBRE</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Club Nox Madrid"
            />
          </div>
          <div>
            <label className={labelClass}>LICENCIA</label>
            <input
              className={`${inputClass} uppercase font-mono`}
              value={form.license}
              onChange={(e) => setForm({ ...form, license: e.target.value })}
              placeholder="LIC-MAD-0000"
            />
          </div>
          <div>
            <label className={labelClass}>CIUDAD</label>
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div className="md:col-span-3">
            <label className={labelClass}>DIRECCIÓN</label>
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Calle, Número, Ciudad"
            />
          </div>
          <div>
            <label className={labelClass}>CAPACIDAD MÁXIMA</label>
            <input
              type="number"
              min={50}
              max={15000}
              className={inputClass}
              value={form.maxCapacity}
              onChange={(e) => setForm({ ...form, maxCapacity: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass}>PORCENTAJE DE AFORO (%)</label>
            <input
              type="number"
              min={50}
              max={98}
              className={inputClass}
              value={form.capacityPercent}
              onChange={(e) => setForm({ ...form, capacityPercent: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass}>TECNOLOGÍA DE VALIDACIÓN</label>
            <select
              className={inputClass}
              value={form.validationTechnology}
              onChange={(e) =>
                setForm({ ...form, validationTechnology: e.target.value as Venue["validationTechnology"] })
              }
            >
              <option value="DUAL">Dual (BLE + QR)</option>
              <option value="BLE">Solo Bluetooth</option>
              <option value="QR">Solo QR</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>UMBRALES RSSI (dBm): {form.rssiThreshold}</label>
            <input
              type="range"
              min={-70}
              max={-40}
              className="w-full accent-primary"
              value={form.rssiThreshold}
              onChange={(e) => setForm({ ...form, rssiThreshold: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelClass}>ROTACIÓN QR (SEGUNDOS)</label>
            <input
              type="number"
              min={5}
              max={120}
              className={inputClass}
              value={form.qrRotationSeconds}
              onChange={(e) => setForm({ ...form, qrRotationSeconds: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            className={`${primaryButton} h-11 px-5`}
            disabled={busy || !form.name || !form.license}
            onClick={() => void submit()}
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {editId ? "Guardar cambios" : "Crear local"}
          </button>
          {editId ? (
            <button
              type="button"
              className={`${secondaryButton} h-11 px-5`}
              onClick={() => {
                setEditId(null);
              }}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Consulta de Local" step="C">
        {venuesState.loading ? (
          <p className="text-body-sm text-on-surface-variant">Cargando…</p>
        ) : venuesState.error ? (
          <p className="text-body-sm text-error">{venuesState.error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm font-body-sm">
              <thead>
                <tr className="text-left text-label-mono-sm font-label-mono-sm text-outline border-b border-outline-variant/40">
                  <th className="py-2 pr-3">NOMBRE</th>
                  <th className="py-2 pr-3">LICENCIA</th>
                  <th className="py-2 pr-3">CIUDAD</th>
                  <th className="py-2 pr-3">CAPACIDAD</th>
                  <th className="py-2 pr-3">VALIDACIÓN</th>
                  <th className="py-2 pr-3">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {(venuesState.data?.items ?? []).map((venue) => (
                  <tr key={venue.id} className="border-b border-outline-variant/20 text-on-surface">
                    <td className="py-2 pr-3 font-semibold">{venue.name}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{venue.license}</td>
                    <td className="py-2 pr-3">{venue.city}</td>
                    <td className="py-2 pr-3">{venue.maxCapacity}</td>
                    <td className="py-2 pr-3">{venue.validationTechnology}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <button type="button" className="text-primary hover:underline" onClick={() => startEdit(venue)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-error hover:underline"
                          onClick={() => void remove(venue.id)}
                        >
                          Baja
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(venuesState.data?.items.length ?? 0) === 0 ? (
              <p className="text-body-sm text-on-surface-variant mt-3">Sin locales registrados.</p>
            ) : null}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
