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
  const [transcriptOpen, setTranscriptOpen] = useState<boolean>(false);

  const step = stepsById.get(stepId);

  useEffect(() => {
    if (!step) return;
    setMessages([{ id: "m0", from: "host", text: step.host }]);
    setExtraOpen(false);
    setExtraText("");
    setTranscriptOpen(false);
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
        <div className="rounded-2xl border border-black/10 bg-white/60 p-4 text-base md:text-lg">
          Wizard error: step not found: <span className="font-mono">{String(stepId)}</span>
        </div>
      </div>
    );
  }

  const allSteps = (script.steps as any[]) ?? [];
  const totalSteps = allSteps.filter((s) => typeof s?.id === "string" && s.id !== "__COMPLETE__").length || 1;
  const stepIndex = Math.max(0, allSteps.findIndex((s) => s?.id === stepId));
  const progressPct = Math.max(0, Math.min(100, Math.round(((Math.min(stepIndex + 1, totalSteps)) / totalSteps) * 100)));

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
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        {/* Ride Marquee */}
        <div className="mb-4 rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide opacity-70">Act I • Forge the Hero</div>
              <div className="mt-1 text-2xl font-semibold">{script.persona.name}</div>
              {script.persona.title ? <div className="mt-1 text-sm opacity-80">{script.persona.title}</div> : null}
              {script.persona.subtitle ? <div className="mt-2 text-sm opacity-90">{script.persona.subtitle}</div> : null}
            </div>

            <div className="min-w-[200px] text-right">
              <div className="text-sm opacity-80">
                Step {Math.min(stepIndex + 1, totalSteps)} of {totalSteps}
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10">
                <div className="h-full bg-black/30" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-1 text-xs opacity-60">{progressPct}%</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm opacity-70">Ride Mode: one moment at a time. Transcript is optional.</div>
            <button
              type="button"
              className="text-sm underline opacity-70 hover:opacity-100"
              onClick={() => setTranscriptOpen((v) => !v)}
            >
              {transcriptOpen ? "Hide transcript" : "Show transcript"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Stage */}
          <div>
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="text-xs uppercase tracking-wide opacity-60">{script.persona.name} says</div>
              <div className="mt-2 text-lg md:text-xl leading-relaxed">{step.host}</div>
              <div className="mt-3 text-sm opacity-60">You can change choices later.</div>
            </div>

            <div className="mt-4 rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm">
              {step.kind === "say" ? (
                <div className="flex justify-end">
                  <Button onClick={handleSayContinue}>Continue</Button>
                </div>
              ) : null}

              {step.kind === "choice" ? (
                <div className="space-y-3">
                  {step.extraFlavor ? (
                    <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium opacity-80">
                          {step.extraFlavor.label ?? "Add extra flavor (optional)"}
                        </div>
                        <button
                          type="button"
                          className="text-sm underline opacity-70 hover:opacity-100"
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
                          className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-base outline-none"
                        />
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {step.choices.map((c) => (
                      <Button key={c.id} onClick={() => handleChoice(c)} variant="secondary">
                        {c.label}
                      </Button>
                    ))}
                  </div>

                  {step.choices.some((c) => c.hint) ? (
                    <div className="mt-2 space-y-1 text-sm opacity-75">
                      {step.choices
                        .filter((c) => c.hint)
                        .map((c) => (
                          <div key={c.id}>
                            <span className="font-medium">{c.label}:</span> {c.hint}
                          </div>
                        ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step.kind === "text" ? (
                <TextStep step={step} state={state} setState={setState} setMessages={setMessages} goNext={goNext} />
              ) : null}
            </div>

            {/* Transcript Drawer */}
            {transcriptOpen ? (
              <div className="mt-4 rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm">
                <div className="text-sm font-semibold">Transcript</div>
                <div className="mt-3 space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className={m.from === "host" ? "flex justify-start" : "flex justify-end"}>
                      <div
                        className={
                          m.from === "host"
                            ? "max-w-[90%] rounded-2xl border border-black/10 bg-white p-3 shadow-sm"
                            : "max-w-[90%] rounded-2xl border border-black/10 bg-black/5 p-3 shadow-sm"
                        }
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Park Pass */}
          <div className="rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm">
            <div className="text-sm font-semibold">Your Park Pass</div>
            <div className="mt-1 text-xs opacity-70">Updates as you make choices.</div>
            <pre className="mt-3 max-h-[70vh] overflow-auto rounded-2xl border border-black/10 bg-white p-3 text-xs leading-relaxed">
{JSON.stringify(state, null, 2)}
            </pre>
          </div>
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
    <div className="space-y-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={step.placeholder ?? "Type here..."}
        className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-base outline-none"
      />
      <div className="flex justify-end">
        <Button onClick={submit} disabled={disabled}>
          Continue
        </Button>
      </div>
    </div>
  );
}
