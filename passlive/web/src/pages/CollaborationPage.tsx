import { useState } from "react";
import { api } from "../api/client";
import type { Ticket } from "../api/types";
import { ProcessTracker } from "../components/ProcessTracker";
import { SectionCard, inputClass, labelClass, primaryButton, secondaryButton } from "../components/ui";

interface SyncMessage {
  id: string;
  type: "TICKET_SENT" | "VALIDATION_CONFIRMED";
  ticketId: string;
  localId: string | null;
  status: "PENDING" | "SENT" | "CONFIRMED";
  createdAt: string;
}

/**
 * Screen: "Colaboración entre Sistema de Venta y Locales - PassLive"
 * BPMN: Colaboración_entre_Sistema_de_Venta_y_Locales.
 */
export function CollaborationPage() {
  const [qrCode, setQrCode] = useState("");
  const [localId, setLocalId] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [messages, setMessages] = useState<SyncMessage[]>([]);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendTicketData() {
    setBusy(true);
    setMessage(null);
    try {
      const ticket = await api<Ticket>(`/tickets/by-qr/${encodeURIComponent(qrCode)}`);
      await api("/sync/tickets", {
        method: "POST",
        body: {
          qrCode: ticket.qrCode,
          bleToken: ticket.bleToken,
          type: ticket.type,
          eventId: ticket.eventId,
          localId,
          purchaseDate: ticket.purchaseDate,
        },
      });
      setResult("Datos de entrada enviados al Local (MessageFlow_1) y almacenados en su BD local.");
      setMessage({ kind: "ok", text: "Entrada sincronizada con el local." });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error al sincronizar" });
    } finally {
      setBusy(false);
    }
  }

  async function confirmValidation(resultValue: "ALLOWED" | "DENIED") {
    setBusy(true);
    setMessage(null);
    try {
      await api("/sync/confirmations", {
        method: "POST",
        body: { qrCode, method: "QR", result: resultValue, localId },
      });
      setResult("Confirmación de validación enviada al Sistema de Venta (MessageFlow_2).");
      setMessage({ kind: "ok", text: "Estado de entrada actualizado en el sistema central." });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error al confirmar" });
    } finally {
      setBusy(false);
    }
  }

  async function loadMessages() {
    setBusy(true);
    try {
      const ticket = await api<Ticket>(`/tickets/by-qr/${encodeURIComponent(qrCode)}`);
      const res = await api<{ items: SyncMessage[] }>(`/sync/messages/${ticket.id}`);
      setMessages(res.items);
      setMessage({ kind: "ok", text: `${res.items.length} mensajes de sincronización.` });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Error al consultar" });
    } finally {
      setBusy(false);
    }
  }

  const steps = [
    { label: "Entrada vendida", detail: "Process_Sistema", state: "done" as const },
    { label: "Enviar datos al Local", detail: "MessageFlow_1", state: qrCode && localId ? ("done" as const) : ("active" as const) },
    { label: "Almacenar en BD local", detail: "Task_Almacenar", state: result ? ("done" as const) : ("idle" as const) },
    { label: "Validar entrada", detail: "Task_Validar", state: result ? ("done" as const) : ("idle" as const) },
    { label: "Confirmación de validación", detail: "MessageFlow_2", state: messages.length > 0 ? ("done" as const) : ("idle" as const) },
    { label: "Proceso sincronizado", detail: "EndEvent", state: messages.length > 0 ? ("done" as const) : ("idle" as const) },
  ];

  return (
    <div>
      <ProcessTracker
        processId="COLLABORATION"
        title="Colaboración entre Sistema de Venta y Locales"
        subtitle="Sincronización de datos de entrada y confirmaciones de validación entre el sistema central y los locales."
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
          <SectionCard title="MessageFlow_1 · Enviar datos de entrada al Local" step="1">
            <label className={labelClass}>CÓDIGO QR DE LA ENTRADA</label>
            <input
              className={inputClass}
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="QR-XXXX-XXXX"
            />
            <label className={`${labelClass} mt-4`}>ID DEL LOCAL DESTINO</label>
            <input
              className={inputClass}
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              placeholder="Identificador del local"
            />
            <button
              type="button"
              className={`${primaryButton} w-full h-12 mt-4`}
              disabled={busy || !qrCode || !localId}
              onClick={() => void sendTicketData()}
            >
              <span className="material-symbols-outlined text-xl">send</span>
              Enviar datos de entrada (QR, tipo, evento)
            </button>
            {result ? (
              <div className="mt-4 p-3 rounded-lg bg-primary-container/20 border border-primary/40 text-body-sm text-primary">
                {result}
              </div>
            ) : null}
          </SectionCard>
        </div>

        <div className="lg:col-span-6">
          <SectionCard title="MessageFlow_2 · Confirmación de validación" step="2">
            <div className="flex gap-3">
              <button
                type="button"
                className={`${primaryButton} flex-1 h-12`}
                disabled={busy || !qrCode || !localId}
                onClick={() => void confirmValidation("ALLOWED")}
              >
                <span className="material-symbols-outlined text-xl">check_circle</span>
                Confirmar acceso permitido
              </button>
              <button
                type="button"
                className={`${secondaryButton} flex-1 h-12`}
                disabled={busy || !qrCode || !localId}
                onClick={() => void confirmValidation("DENIED")}
              >
                <span className="material-symbols-outlined text-lg">cancel</span>
                Confirmar denegación
              </button>
            </div>

            <button
              type="button"
              className={`${secondaryButton} w-full h-11 mt-4`}
              disabled={busy || !qrCode}
              onClick={() => void loadMessages()}
            >
              <span className="material-symbols-outlined text-lg">history</span>
              Ver historial de sincronización
            </button>

            {messages.length > 0 ? (
              <div className="mt-4 space-y-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className="flex justify-between items-center p-2 rounded bg-surface-container border border-outline-variant/30 font-label-mono-sm text-label-mono-sm"
                  >
                    <span className="text-on-surface">{m.type}</span>
                    <span className={m.status === "CONFIRMED" ? "text-secondary" : "text-primary"}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
