import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import type { WizardMessage, WizardScript, WizardStep, WizardChoice } from "./types";

type Props<TState> = {
  script: WizardScript<TState>;
  initialState: TState;
  onComplete?: (state: TState) => void;
  className?: string;
};

function byId<T extends { id: string }>(arr: T[]) {
  const map = new Map<string, T>();
  for (const item of arr) map.set(item.id, item);
  return map;
}

export function ChatWizard<TState>(props: Props<TState>) {
  const { script, initialState, onComplete, className } = props;

  const stepsById = useMemo(() => byId<WizardStep<TState>>(script.steps as any), [script.steps]);

  const [state, setState] = useState<TState>(initialState);
  const [stepId, setStepId] = useState<string>(script.initialStepId);
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [extraOpen, setExtraOpen] = useState<boolean>(false);
  const [extraText, setExtraText] = useState<string>("");

  const step = stepsById.get(stepId);

  useEffect(() => {
    if (!step) return;
    setMessages([{ id: "m0", from: "host", text: step.host }]);
    setExtraOpen(false);
    setExtraText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!step) return;
    setExtraOpen(false);
    setExtraText("");

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.from === "host" && last.text === step.host) return prev;
      return prev.concat([{ id: `m${prev.length}`, from: "host", text: step.host }]);
    });
  }, [stepId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!step) {
    return (
      <div className={className}>
        <div className="rounded-2xl border border-black/10 bg-white/60 p-4 text-base md:text-lg text-base md:text-lg">
          Wizard error: step not found: <span className="font-mono text-base md:text-lg">{String(stepId)}</span>
        </div>
      </div>
    );
  }

  const goNext = (next: string) => {
    if (next === "__COMPLETE__") {
      onComplete?.(state);
      return;
    }
    setStepId(next);
  };

  const handleChoice = (choice: WizardChoice) => {
    setMessages((prev) => prev.concat([{ id: `m${prev.length}`, from: "user", text: choice.label }]));

    const nextState = (step.kind === "choice" ? (step.apply as any)(state, choice) : state) as TState;

    let finalState = nextState;
    if (step.kind === "choice" && step.extraFlavor?.apply && extraOpen && extraText.trim().length > 0) {
      finalState = (step.extraFlavor.apply as any)(finalState, extraText.trim()) as TState;
      setMessages((prev) =>
        prev.concat([{ id: `m${prev.length}`, from: "user", text: `(extra) ${extraText.trim()}` }])
      );
    }

    setState(finalState);

    const nextId =
      typeof step.nextId === "function" ? (step.nextId as any)(finalState, choice) : (step.nextId as string);

    goNext(nextId);
  };

  const handleSayContinue = () => {
    if (step.kind !== "say") return;
    goNext(step.nextId);
  };

  return (
    <div className={className}>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 text-base md:text-lg">
        <div className="mb-4 rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm text-base md:text-lg">
          <div className="text-base md:text-lg font-semibold text-base md:text-lg">{script.persona.name}</div>
          {script.persona.title ? <div className="text-sm opacity-80 text-base md:text-lg">{script.persona.title}</div> : null}
          {script.persona.subtitle ? <div className="mt-1 text-base md:text-lg opacity-90 text-base md:text-lg">{script.persona.subtitle}</div> : null}
        </div>

        <div className="space-y-3 text-base md:text-lg">
          {messages.map((m) => (
            <div key={m.id} className={m.from === "host" ? "flex justify-start" : "flex justify-end"}>
              <div
                className={
                  m.from === "host"
                    ? "max-w-[85%] rounded-2xl border border-black/10 bg-white p-3 text-base md:text-lg shadow-sm"
                    : "max-w-[85%] rounded-2xl border border-black/10 bg-black/5 p-3 text-base md:text-lg shadow-sm"
                }
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm text-base md:text-lg">
          {step.kind === "say" ? (
            <div className="flex justify-end text-base md:text-lg">
              <Button onClick={handleSayContinue}>Continue</Button>
            </div>
          ) : null}

          {step.kind === "choice" ? (
            <div className="space-y-3 text-base md:text-lg">
              {step.extraFlavor ? (
                <div className="rounded-xl border border-black/10 bg-white/60 p-3 text-base md:text-lg">
                  <div className="flex items-center justify-between gap-2 text-base md:text-lg">
                    <div className="text-sm font-medium opacity-80 text-base md:text-lg">
                      {step.extraFlavor.label ?? "Add extra flavor (optional)"}
                    </div>
                    <button
                      type="button"
                      className="text-sm underline opacity-70 hover:opacity-100 text-base md:text-lg"
                      onClick={() => setExtraOpen((v) => !v)}
                    >
                      {extraOpen ? "Hide" : "Add"}
                    </button>
                  </div>
                  {extraOpen ? (
                    <input
                      value={extraText}
                      onChange={(e) => setExtraText(e.target.value)}
                      placeholder={step.extraFlavor.placeholder ?? "A short detail..."}
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-base md:text-lg outline-none text-base md:text-lg"
                    />
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 text-base md:text-lg">
                {step.choices.map((c) => (
                  <Button key={c.id} onClick={() => handleChoice(c)} variant="secondary">
                    {c.label}
                  </Button>
                ))}
              </div>

              {step.choices.some((c) => c.hint) ? (
                <div className="mt-2 space-y-1 text-sm opacity-75 text-base md:text-lg">
                  {step.choices
                    .filter((c) => c.hint)
                    .map((c) => (
                      <div key={c.id}>
                        <span className="font-medium text-base md:text-lg">{c.label}:</span> {c.hint}
                      </div>
                    ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {step.kind === "text" ? (
            <TextStep
              step={step}
              state={state}
              setState={setState}
              setMessages={setMessages}
              goNext={goNext}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TextStep<TState>(props: {
  step: Extract<WizardStep<TState>, { kind: "text" }>;
  state: TState;
  setState: (s: TState) => void;
  setMessages: React.Dispatch<React.SetStateAction<WizardMessage[]>>;
  goNext: (next: string) => void;
}) {
  const { step, state, setState, setMessages, goNext } = props;
  const [text, setText] = useState<string>("");

  const disabled = step.required ? text.trim().length === 0 : false;

  const submit = () => {
    const value = text.trim();
    if (step.required && value.length === 0) return;

    setMessages((prev) => prev.concat([{ id: `m${prev.length}`, from: "user", text: value || "(skipped)" }]));
    const nextState = step.apply(state, value);
    setState(nextState);
    goNext(step.nextId);
  };

  return (
    <div className="space-y-3 text-base md:text-lg">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={step.placeholder ?? "Type here..."}
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-base md:text-lg outline-none text-base md:text-lg"
      />
      <div className="flex justify-end text-base md:text-lg">
        <Button onClick={submit} disabled={disabled}>
          Continue
        </Button>
      </div>
    </div>
  );
}
