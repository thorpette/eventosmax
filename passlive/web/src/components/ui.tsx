import type { ReactNode } from "react";

export function SectionCard({
  title,
  step,
  action,
  children,
}: {
  title: string;
  step?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {step ? (
            <span className="w-6 h-6 rounded-md bg-primary-container text-on-primary-container flex items-center justify-center font-label-mono-sm text-xs font-bold">
              {step}
            </span>
          ) : null}
          <h2 className="text-title-md font-title-md text-on-surface font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-3 py-2 text-body-md font-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-0";

export const labelClass =
  "block text-label-mono-sm font-label-mono-sm text-on-surface-variant mb-1.5";

export const primaryButton =
  "bg-primary-container hover:bg-inverse-primary text-on-primary-fixed font-title-md font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 shadow-md disabled:opacity-50";

export const secondaryButton =
  "bg-transparent hover:bg-surface-container text-on-surface-variant border border-outline-variant/60 font-body-md rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95";

export const errorButton =
  "bg-error-container hover:bg-error hover:text-on-error text-on-error-container font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95";
