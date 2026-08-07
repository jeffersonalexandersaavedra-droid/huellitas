import { Clock, CheckCircle2, Receipt, Check } from "lucide-react";

const STEPS = [
  { key: "validando", label: "Validando", icon: Clock },
  { key: "verificado", label: "Verificado", icon: CheckCircle2 },
  { key: "pagado", label: "Pagado", icon: Receipt },
];

function activeIndexFromEstado(estado) {
  if (estado === "validando") return 0;
  if (estado === "verificado") return 1;
  if (estado === "pagado") return 2;
  return -1;
}

function getStepStatus(index, activeIndex) {
  if (activeIndex === -1) return "future";
  if (index < activeIndex) return "completed";
  if (index === activeIndex) {
    return activeIndex === STEPS.length - 1 ? "completed" : "current";
  }
  return "future";
}

export default function StepperPago({ estado }) {
  const activeIndex = activeIndexFromEstado(estado);

  return (
    <div className="flex items-start">
      {STEPS.map((step, index) => {
        const status = getStepStatus(index, activeIndex);
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={
                  "flex h-10 w-10 items-center justify-center rounded-full " +
                  (status === "completed"
                    ? "bg-huellitas-primary text-white"
                    : status === "current"
                      ? "animate-pulse bg-huellitas-accent text-white"
                      : "bg-stone-200 text-stone-400")
                }
              >
                {status === "completed" ? (
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                ) : (
                  <Icon className="h-5 w-5" strokeWidth={2} />
                )}
              </div>
              <span
                className={
                  "mt-2 text-xs font-medium " +
                  (status === "future" ? "text-stone-400" : "text-huellitas-ink")
                }
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={
                  "mx-2 mt-5 h-0.5 flex-1 " +
                  (index < activeIndex ? "bg-huellitas-primary" : "bg-stone-200")
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
