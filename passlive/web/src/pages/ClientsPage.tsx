import { useState } from "react";
import { api } from "../api/client";
import type { Client } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import { SectionCard, inputClass, labelClass, primaryButton, secondaryButton, errorButton } from "../components/ui";

/**
 * Screen: "Gestion de Cliente - PassLive Verde Mate"
 * BPMN: Gestion_de_Cliente (Alta / Consulta / Edición / Baja).
 */
export function ClientsPage() {
  const clientsState = useAsync(() => api<{ items: Client[] }>("/clients"));
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const [form, setForm] = useState({
    name: "",
    dni: "",
    birthDate: "1998-05-14",
    email: "",
    phone: "",
  });

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      if (editId) {
        await api(`/clients/${editId}`, { method: "PUT", body: form });
        setMessage({ kind: "ok", text: "Datos de cliente actualizados (Edición)." });
      } else {
        await api("/clients", { method: "POST", body: form });
        setMessage({ kind: "ok", text: "Cliente registrado. Credencial BLE generada (Alta)." });
      }
      setEditId(null);
      setForm({ name: "", dni: "", birthDate: "1998-05-14", email: "", phone: "" });
      clientsState.reload();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/clients/${deleting.id}`, { method: "DELETE" });
      setMessage({ kind: "ok", text: "Cliente dado de baja. Beacon revocado y proceso finalizado." });
      setDeleting(null);
      setDeleteReason("");
      clientsState.reload();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  const filtered = (clientsState.data?.items ?? []).filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dni.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
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

      <SectionCard title={editId ? "Edición de Cliente" : "Registrar nuevo Cliente"} step={editId ? "E" : "A"}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>NOMBRE COMPLETO</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Carlos Mendoza Gil"
            />
          </div>
          <div>
            <label className={labelClass}>DNI / PASAPORTE / NIE</label>
            <input
              className={`${inputClass} font-mono`}
              value={form.dni}
              onChange={(e) => setForm({ ...form, dni: e.target.value })}
              placeholder="48291048K"
              readOnly={Boolean(editId)}
            />
          </div>
          <div>
            <label className={labelClass}>FECHA DE NACIMIENTO</label>
            <input
              type="date"
              className={`${inputClass} font-mono`}
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>EMAIL</label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="carlos.mendoza@passlive.app"
            />
          </div>
          <div>
            <label className={labelClass}>TELÉFONO</label>
            <input
              className={`${inputClass} font-mono`}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+34 612 345 678"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            className={`${primaryButton} h-11 px-5`}
            disabled={busy || !form.name || !form.dni}
            onClick={() => void submit()}
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {editId ? "Guardar cambios" : "Registrar cliente"}
          </button>
          {editId ? (
            <button type="button" className={`${secondaryButton} h-11 px-5`} onClick={() => setEditId(null)}>
              Cancelar
            </button>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Consulta de Cliente"
        step="C"
        action={
          <input
            className="w-64 bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-body-sm text-on-surface focus:border-primary outline-none"
            placeholder="Buscar DNI, nombre, email o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      >
        {clientsState.loading ? (
          <p className="text-body-sm text-on-surface-variant">Cargando…</p>
        ) : clientsState.error ? (
          <p className="text-body-sm text-error">{clientsState.error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm font-body-sm">
              <thead>
                <tr className="text-left text-label-mono-sm font-label-mono-sm text-outline border-b border-outline-variant/40">
                  <th className="py-2 pr-3">NOMBRE</th>
                  <th className="py-2 pr-3">DNI</th>
                  <th className="py-2 pr-3">NACIMIENTO</th>
                  <th className="py-2 pr-3">EMAIL</th>
                  <th className="py-2 pr-3">TOKEN BLE</th>
                  <th className="py-2 pr-3">ESTADO</th>
                  <th className="py-2 pr-3">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id} className="border-b border-outline-variant/20 text-on-surface">
                    <td className="py-2 pr-3 font-semibold">{client.name}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{client.dni}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{client.birthDate}</td>
                    <td className="py-2 pr-3">{client.email}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{client.bleToken.slice(0, 16)}…</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded text-label-mono-sm font-label-mono-sm ${
                          client.status === "ACTIVE"
                            ? "bg-primary-container/30 text-primary"
                            : "bg-error-container/60 text-on-error-container"
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => {
                            setEditId(client.id);
                            setForm({
                              name: client.name,
                              dni: client.dni,
                              birthDate: client.birthDate,
                              email: client.email,
                              phone: client.phone,
                            });
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-error hover:underline"
                          onClick={() => setDeleting(client)}
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
              <p className="text-body-sm text-on-surface-variant mt-3">Sin clientes registrados.</p>
            ) : null}
          </div>
        )}
      </SectionCard>

      {deleting ? (
        <SectionCard title="Dar de baja Cliente" step="B">
          <p className="text-body-sm text-on-surface-variant mb-4">
            Cliente: <span className="font-mono">{deleting.name} (DNI: {deleting.dni})</span>
          </p>
          <label className={labelClass}>MOTIVO DE BAJA</label>
          <select className={inputClass} value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}>
            <option value="">Seleccione un motivo…</option>
            <option value="SOLICITUD_DEL_TITULAR">Solicitud del titular</option>
            <option value="INCIDENCIA">Incidencia / atestado</option>
            <option value="CADUCIDAD">Caducidad de datos</option>
          </select>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              className={`${errorButton} h-11 px-5`}
              disabled={busy || !deleteReason}
              onClick={() => void confirmDelete()}
            >
              <span className="material-symbols-outlined text-lg">delete_forever</span>
              Confirmar baja y revocar beacon
            </button>
            <button type="button" className={`${secondaryButton} h-11 px-5`} onClick={() => setDeleting(null)}>
              Cancelar
            </button>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
