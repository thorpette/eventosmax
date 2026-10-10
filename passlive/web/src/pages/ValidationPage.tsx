import { useState } from "react";
import { api } from "../api/client";
import type { AccessEvaluation, Ticket, ValidationResponse } from "../api/types";
import { ProcessTracker, type StepState } from "../components/ProcessTracker";
import { SectionCard, inputClass, labelClass, primaryButton, secondaryButton, errorButton } from "../components/ui";

/**
 * Screen: "Proceso de Validación de Entradas en Acceso"
 * BPMN: inclusive gateway QR/BT -> ¿Entrada válida? -> registrar/denegar.
 */
export function ValidationPage() {
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<"QR" | "BLE">("QR");
  const [rssi, setRssi] = useState(-58);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [evaluation, setEvaluation] = useState<AccessEvaluation | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function validate() {
    setBusy(true);
    setMessage(null);
    setEvaluation(null);
    try {
      if (method === "QR") {
        const result = await api<ValidationResponse>("/validation/qr", {
          method: "POST",
          body: { qrCode: code, method: "QR" },
        });
        setValidation(result);
        if (result.entradaValida) {
          const detail = await api<Ticket>(`/tickets/by-qr/${encodeURIComponent(code)}`);
          setTicket(detail);
          setMessage({ kind: "ok", text: "Entrada válida: continue con el control de restricciones." });
        } else {
          setTicket(null);
          setMessage({ kind: "error", text: result.reason ?? "Entrada no válida." });
        }
      } else {
        const result = await api<ValidationResponse>("/validation/ble", {
          method: "POST",
          body: { bleToken: code, method: "BLE", rssi },
        });
        setValidation(result);
        if (result.entradaValida) {
          const detail = await api<Ticket>(`/tickets/by-qr/${encodeURIComponent(code)}`).catch(() => null);
          setTicket(detail);
          setMessage({ kind: "ok", text: "Señal BLE en rango: entrada válida." });
        } else {
          setTicket(null);
          setMessage({ kind: "error", text: result.reason ?? "Validación Bluetooth fallida." });
        }
      }
    } catch (err) {
      setValidation(null);
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error al validar" });
    } finally {
      setBusy(false);
    }
  }

  /** Task_Registrar + Task_Denegar: registra el acceso y actualiza el estado. */
  async function registerAccess(allowed: boolean) {
    if (!ticket) return;
    setBusy(true);
    try {
      const result = await api<AccessEvaluation>("/validation/access", {
        method: "POST",
        body: {
          ticketId: ticket.id,
          // Sin birthDate/minAge el backend usa los datos registrados del
          // cliente y la restricción del evento (BPMN Task_1 + Gateway_1).
          method,
        },
      });
      setEvaluation(result);
      const ok = result.allowed ?? allowed;
      setMessage(
        ok
          ? { kind: "ok", text: "Acceso registrado: entrada actualizada a UTILIZADA." }
          : { kind: "error", text: result.evaluation.reason ?? "Acceso denegado y notificado al cliente." },
      );
      if (!ok) {
        // Rama denegar: registrar motivo
        await api("/access-control/deny/" + ticket.id, {
          method: "POST",
          body: { reason: "Denegado por el operador en el punto de acceso" },
        }).catch(() => undefined);
      }
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error al registrar" });
    } finally {
      setBusy(false);
    }
  }

  const steps: Array<{ label: string; detail: string; state?: StepState }> = [
    { label: "Cliente llega al acceso", detail: "Inicio", state: "done" as const },
    { label: "Solicitar entrada", detail: code || "Pendiente", state: code ? ("done" as const) : ("active" as const) },
    { label: "Método de validación", detail: method === "QR" ? "Código QR" : "Bluetooth BLE", state: "done" as const },
    { label: "¿Entrada válida?", detail: validation ? (validation.entradaValida ? "Sí" : "No") : "Evaluar", state: validation ? (validation.entradaValida ? "done" : "error") : "idle" },
    { label: "Registrar acceso", detail: evaluation ? evaluation.accessRecord.result : "Pendiente", state: evaluation ? (evaluation.evaluation.allowed ? "done" : "error") : "idle" },
    { label: "Acceso finalizado", detail: evaluation ? (evaluation.evaluation.route ?? "DENIED") : "Pendiente", state: evaluation ? ("done" as const) : ("idle" as const) },
  ];

  return (
    <div>
      <ProcessTracker
        processId="PROCESS_1"
        title="Proceso de Validación de Entradas en Acceso"
        subtitle="Validación dual por código QR y señal Bluetooth con gateway de decisión de acceso."
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
        <div className="lg:col-span-7">
          <SectionCard title="Escanear o introducir código de entrada" step="1">
            <label className={labelClass}>MÉTODO DE VALIDACIÓN (INCLUSIVE GATEWAY)</label>
            <div className="flex gap-3 mb-4">
              {(["QR", "BLE"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-body-md font-body-md transition-colors border ${
                    method === m
                      ? "bg-primary-container/20 border-primary text-primary font-semibold"
                      : "bg-surface-container border-outline-variant/40 text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {m === "QR" ? "qr_code_scanner" : "bluetooth_searching"}
                  </span>
                  {m === "QR" ? "Código QR" : "Bluetooth (BLE)"}
                </button>
              ))}
            </div>

            <label className={labelClass}>
              {method === "QR" ? "CÓDIGO QR" : "TOKEN BLE"}
            </label>
            <input
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={method === "QR" ? "QR-XXXX-XXXX" : "BLE-xxxxxxxx-xxxx"}
            />

            {method === "BLE" ? (
              <div className="mt-4">
                <label className={labelClass}>SEÑAL RSSI (dBm) — UMBRAL DEL LOCAL</label>
                <input
                  type="range"
                  min={-100}
                  max={-40}
                  value={rssi}
                  className="w-full accent-primary"
                  onChange={(e) => setRssi(Number(e.target.value))}
                />
                <div className="text-label-mono-sm font-label-mono-sm text-outline">
                  RSSI actual: {rssi} dBm
                </div>
              </div>
            ) : null}

            <button
              type="button"
              className={`${primaryButton} w-full h-12 mt-5`}
              disabled={busy || !code}
              onClick={() => void validate()}
            >
              <span className="material-symbols-outlined text-xl">scan</span>
              <span>{busy ? "Validando…" : "Validar entrada"}</span>
            </button>
          </SectionCard>

          <SectionCard
            title="Resultado de la validación"
            step="2"
            action={
              validation ? (
                <span
                  className={`px-2.5 py-1 rounded text-label-mono-sm font-label-mono-sm font-semibold border ${
                    validation.entradaValida
                      ? "bg-primary-container/30 text-primary border-primary/40"
                      : "bg-error-container text-on-error-container border-error/40"
                  }`}
                >
                  {validation.entradaValida ? "ENTRADA VÁLIDA" : "ENTRADA NO VÁLIDA"}
                </span>
              ) : null
            }
          >
            {!validation ? (
              <p className="text-body-sm text-on-surface-variant">
                Aún no se ha validado ninguna entrada.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/40">
                    <div className="text-label-mono-sm font-label-mono-sm text-outline">MÉTODO</div>
                    <div className="text-body-md font-body-md font-semibold text-on-surface">
                      {validation.method}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/40">
                    <div className="text-label-mono-sm font-label-mono-sm text-outline">GATEWAY</div>
                    <div
                      className={`text-body-md font-body-md font-semibold ${
                        validation.entradaValida ? "text-secondary" : "text-error"
                      }`}
                    >
                      {validation.entradaValida ? "entradaValida == true" : "entradaValida == false"}
                    </div>
                  </div>
                </div>

                {validation.event ? (
                  <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40">
                    <div className="text-label-mono-sm font-label-mono-sm text-outline">EVENTO</div>
                    <div className="text-body-md font-body-md text-on-surface">
                      {validation.event.name} · Restricción {validation.event.ageRestriction} ·{" "}
                      {validation.event.minAge}+
                    </div>
                  </div>
                ) : null}

                {validation.client ? (
                  <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40">
                    <div className="text-label-mono-sm font-label-mono-sm text-outline">CLIENTE</div>
                    <div className="text-body-md font-body-md text-on-surface">
                      {validation.client.name} · DNI {validation.client.dni}
                    </div>
                  </div>
                ) : null}

                {validation.entradaValida && ticket ? (
                  <div className="flex gap-3 pt-3 border-t border-outline-variant/30">
                    <button
                      type="button"
                      className={`${primaryButton} flex-1 h-12`}
                      disabled={busy}
                      onClick={() => void registerAccess(true)}
                    >
                      <span className="material-symbols-outlined text-xl">how_to_reg</span>
                      Registrar acceso
                    </button>
                    <button
                      type="button"
                      className={`${errorButton} flex-1 h-12`}
                      disabled={busy}
                      onClick={() => void registerAccess(false)}
                    >
                      <span className="material-symbols-outlined text-xl">block</span>
                      Denegar acceso
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-5">
          <SectionCard title="Registro de acceso (Task_Registrar / Task_Denegar)" step="3">
            {!evaluation ? (
              <p className="text-body-sm text-on-surface-variant">
                El registro se generará al validar el acceso.
              </p>
            ) : (
              <div className="space-y-3 font-label-mono-sm text-label-mono-sm">
                <Row label="RESULTADO" value={evaluation.accessRecord.result} />
                <Row label="EDAD VERIFICADA" value={evaluation.evaluation.ageVerified ? "SÍ" : "NO"} />
                <Row label="EDAD" value={String(evaluation.evaluation.age)} />
                <Row label="RUTA" value={evaluation.evaluation.route ?? "—"} />
                <Row label="MÉTODO" value={evaluation.accessRecord.method} />
                <Row label="MOTIVO" value={evaluation.evaluation.reason ?? "—"} />
                <Row label="REGISTRADO" value={evaluation.accessRecord.validatedAt} />
              </div>
            )}
          </SectionCard>

          <SectionCard title="Telemetría BLE" step="4">
            <div className="space-y-2.5 font-label-mono-sm text-label-mono-sm">
              <TelemetryRow k="RADIO BLE PROTOCOL" v="RSSI Threshold -65 dBm" />
              <TelemetryRow k="DYNAMIC VALIDATION" v="2D Time-Based OTP (TOTP)" />
              <TelemetryRow k="HARDWARE TARGET" v="Gate Turnstile #04 / Low-Latency" />
              <TelemetryRow k="ACCESSIBILITY" v="WCAG 2.1 AA Compliant" />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center bg-surface-container p-2 rounded border border-outline-variant/30">
      <span className="text-outline">{label}:</span>
      <span className="text-on-surface font-bold">{value}</span>
    </div>
  );
}

function TelemetryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between items-center bg-surface-container p-2 rounded border border-outline-variant/30">
      <span className="text-outline">{k}:</span>
      <span className="text-primary font-bold">{v}</span>
    </div>
  );
}
