import { useState } from "react";
import { api } from "../api/client";
import type { AccessEvaluation, Ticket } from "../api/types";
import { ProcessTracker, type StepState } from "../components/ProcessTracker";
import { SectionCard, inputClass, labelClass, primaryButton, errorButton } from "../components/ui";

/**
 * Screen: "Control de Acceso por Restricciones - PassLive"
 * BPMN: Control_de_Acceso_por_Restricciones.
 */
export function AccessRestrictionsPage() {
  const [ticketId, setTicketId] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [evaluation, setEvaluation] = useState<AccessEvaluation | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function lookup() {
    setBusy(true);
    setMessage(null);
    setEvaluation(null);
    try {
      const detail = await api<Ticket>(`/tickets/${encodeURIComponent(ticketId)}`);
      setTicket(detail);
      setMessage({
        kind: "ok",
        text: `Entrada localizada: ${detail.qrCode} (${detail.type}) — evalúe las restricciones.`,
      });
    } catch (err) {
      setTicket(null);
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Entrada no encontrada" });
    } finally {
      setBusy(false);
    }
  }

  async function evaluate() {
    if (!ticket) return;
    setBusy(true);
    try {
      const result = await api<AccessEvaluation>(
        `/access-control/evaluate/${encodeURIComponent(ticket.id)}`,
      );
      setEvaluation(result);
      setMessage(
        result.evaluation.allowed
          ? {
              kind: "ok",
              text: `Acceso permitido — dirigir a acceso ${result.evaluation.route === "VIP" ? "VIP especial" : "general"}.`,
            }
          : { kind: "error", text: result.evaluation.reason ?? "Acceso denegado" },
      );
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error al evaluar" });
    } finally {
      setBusy(false);
    }
  }

  async function deny() {
    if (!ticket) return;
    setBusy(true);
    try {
      await api(`/access-control/deny/${encodeURIComponent(ticket.id)}`, {
        method: "POST",
        body: { reason: reason || "Restricción de acceso incumplida" },
      });
      setMessage({ kind: "error", text: "Acceso denegado por restricción (Task_4)." });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error al denegar" });
    } finally {
      setBusy(false);
    }
  }

  const ev = evaluation?.evaluation;
  const steps: Array<{ label: string; detail: string; state?: StepState }> = [
    { label: "Entrada validada", detail: ticket ? ticket.qrCode : "Pendiente", state: ticket ? ("done" as const) : ("active" as const) },
    { label: "¿Evento mayores de edad?", detail: ev ? (ev.eventRequiresAdult ? "Sí" : "No") : "Evaluar", state: ev ? ("done" as const) : ("idle" as const) },
    { label: "Verificar edad", detail: ev ? `${ev.age} años` : "Pendiente", state: ev ? (ev.ageVerified ? "done" : "error") : "idle" },
    { label: "¿Tipo VIP?", detail: ev ? (ev.isVip ? "Sí" : "No") : "Pendiente", state: ev ? ("done" as const) : ("idle" as const) },
    { label: "Dirigir acceso", detail: ev?.route ?? "—", state: ev && ev.allowed ? ("done" as const) : ("idle" as const) },
    { label: "Acceso permitido", detail: ev ? (ev.allowed ? "PERMITIDO" : "DENEGADO") : "Pendiente", state: ev ? (ev.allowed ? "done" : "error") : "idle" },
  ];

  return (
    <div>
      <ProcessTracker
        processId="CONTROL_ACCESS"
        title="Control de Acceso por Restricciones"
        subtitle="Verificación de edad (+18/+21) y enrutamiento diferenciado VIP / General tras una validación exitosa."
        steps={steps}
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
        <div className="lg:col-span-6">
          <SectionCard title="Obtener datos del cliente y entrada (Task_1)" step="1">
            <label className={labelClass}>ID DE ENTRADA</label>
            <input
              className={inputClass}
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Identificador interno de la entrada"
            />
            <button
              type="button"
              className={`${primaryButton} w-full h-12 mt-4`}
              disabled={busy || !ticketId}
              onClick={() => void lookup()}
            >
              <span className="material-symbols-outlined text-xl">person_search</span>
              Buscar entrada
            </button>

            {ticket ? (
              <div className="mt-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 space-y-2">
                <InfoRow k="QR" v={ticket.qrCode} />
                <InfoRow k="TIPO" v={ticket.type} />
                <InfoRow k="ESTADO" v={ticket.status} />
                <InfoRow k="CLIENTE" v={ticket.client?.name ?? "—"} />
                <InfoRow k="NACIMIENTO" v={ticket.client?.birthDate ?? "—"} />
                <InfoRow k="RESTRICCIÓN" v={`${ticket.event?.ageRestriction ?? "—"} (${ticket.event?.minAge ?? 0}+)`} />
              </div>
            ) : null}
          </SectionCard>
        </div>

        <div className="lg:col-span-6">
          <SectionCard title="Evaluación de restricciones (Gateway_1 / 2 / 3)" step="2">
            <button
              type="button"
              className={`${primaryButton} w-full h-12`}
              disabled={busy || !ticket}
              onClick={() => void evaluate()}
            >
              <span className="material-symbols-outlined text-xl">fact_check</span>
              Verificar edad y tipo de entrada
            </button>

            {ev ? (
              <div className="mt-4 space-y-3">
                <GateRow label="Gateway_1 · ¿Evento es para mayores de edad?" pass={ev.eventRequiresAdult} detail={ev.eventRequiresAdult ? `Requiere ${ticket?.event?.minAge ?? 0}+` : "Sin restricción"} />
                <GateRow label="Gateway_2 · ¿Verificación de edad exitosa?" pass={ev.ageVerified} detail={`Edad: ${ev.age} años`} />
                <GateRow label="Gateway_3 · ¿Tipo de entrada es VIP?" pass={ev.isVip} detail={ev.isVip ? "Acceso VIP especial" : "Acceso general"} />
                <div
                  className={`p-4 rounded-xl border text-body-md font-body-md font-semibold ${
                    ev.allowed
                      ? "bg-primary-container/20 border-primary/40 text-primary"
                      : "bg-error-container/30 border-error/40 text-error"
                  }`}
                >
                  {ev.allowed
                    ? `Task_7: Permitir acceso al evento — ruta ${ev.route}`
                    : `Task_4: Denegar acceso — ${ev.reason ?? ""}`}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-body-sm text-on-surface-variant">
                La evaluación mostrará el resultado de cada gateway del BPMN.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Denegar acceso por restricción (Task_4)" step="3">
            <label className={labelClass}>MOTIVO DE DENEGACIÓN</label>
            <select className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Seleccione un motivo…</option>
              <option value="Documento DNI físico no presentado.">Documento DNI físico no presentado.</option>
              <option value="Fecha de nacimiento no confirma la edad requerida.">
                Fecha de nacimiento no confirma la edad requerida.
              </option>
              <option value="Sin acreditación VIP para la zona solicitada.">
                Sin acreditación VIP para la zona solicitada.
              </option>
            </select>
            <button
              type="button"
              className={`${errorButton} w-full h-12 mt-4`}
              disabled={busy || !ticket}
              onClick={() => void deny()}
            >
              <span className="material-symbols-outlined text-xl">gavel</span>
              Denegar acceso y notificar al cliente
            </button>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-label-mono-sm font-label-mono-sm">
      <span className="text-outline">{k}</span>
      <span className="text-on-surface font-semibold">{v}</span>
    </div>
  );
}

function GateRow({ label, pass, detail }: { label: string; pass: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-outline-variant/40">
      <div>
        <div className="text-body-sm font-body-sm font-semibold text-on-surface">{label}</div>
        <div className="text-label-mono-sm font-label-mono-sm text-outline">{detail}</div>
      </div>
      <span
        className={`px-2 py-0.5 rounded text-label-mono-sm font-label-mono-sm font-semibold border ${
          pass
            ? "bg-primary-container/30 text-primary border-primary/40"
            : "bg-surface-container-high text-on-surface-variant border-outline-variant/40"
        }`}
      >
        {pass ? "SÍ" : "NO"}
      </span>
    </div>
  );
}
