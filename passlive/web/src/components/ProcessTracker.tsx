interface Props {
  title: string;
  processId: string;
  subtitle?: string;
  steps: Array<{ label: string; detail: string; state?: StepState }>;
}

export type StepState = "done" | "active" | "error" | "idle";

const stateClasses: Record<StepState, string> = {
  done: "bg-primary-container/20 border-2 border-primary text-primary",
  active: "bg-primary-container/20 border-2 border-primary text-primary shadow-sm",
  error: "bg-surface-container border border-error-container/60 text-error",
  idle: "bg-surface-container border border-outline-variant/40 text-on-surface",
};

/** BPMN Process Tracker (componente 3 de las pantallas Stitch). */
export function ProcessTracker({ title, processId, subtitle, steps }: Props) {
  return (
    <section className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-5 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md bg-primary-container text-on-primary-container text-label-mono-sm font-label-mono-sm font-semibold">
            {processId}
          </span>
          <div>
            <h1 className="text-title-md font-title-md text-on-surface font-semibold tracking-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-body-sm font-body-sm text-on-surface-variant">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 text-label-mono-sm font-label-mono-sm text-outline">
          <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse" />
          MOTOR DE DECISIÓN ACTIVO
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((step) => (
          <div
            key={step.label}
            className={`flex flex-col p-3 rounded-lg relative ${stateClasses[step.state ?? "idle"]}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-label-mono-sm font-label-mono-sm text-outline uppercase">
                {step.state === "active" ? "EN CURSO" : step.state === "error" ? "INCIDENCIA" : "PASO"}
              </span>
            </div>
            <div className="text-body-sm font-body-sm font-semibold">{step.label}</div>
            <div className="text-label-mono-sm font-label-mono-sm text-on-surface-variant mt-1">
              {step.detail}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
