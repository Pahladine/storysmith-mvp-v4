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
  const [ideasOpen, setIdeasOpen] = useState<boolean>(false);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);

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
  const markComplete = (id: string) => {
    setCompletedStepIds((prev) => (prev.includes(id) ? prev : prev.concat(id)));
  };

  const stamps = useMemo(() => {
    const out: string[] = [];
    const done = (id: string) => completedStepIds.includes(id);
    const hasText = (v: any) => String(v ?? "").trim().length > 0;

    if (done("childName") && hasText((state as any).childName)) out.push("Hero named");
    if (done("companion") || done("companionName")) out.push("Companion set");
    if (done("vibe")) out.push("Mood set");
    if (done("place")) out.push("Map pinned");
    if (done("length")) out.push("Length set");

    return out;
  }, [completedStepIds, state]);

  const ideasForStep = useMemo(() => {
    const id = stepId;
    // Keep this intentionally small and friendly; we can expand later.
    const map: Record<string, string[]> = {
      childName: ["Arlo", "Scarlett", "Milo", "Nova", "Ruby"],
      readerName: ["Grandpa", "Nana", "Dad", "Mom", "Auntie"],
      relationshipDescription: ["a bedtime story buddy", "my favorite adventurer", "our cozy cuddle-time", "a brave helper", "my giggle partner"],
      companionName: ["a baby axolotl named Billy", "Luna the playful puppy", "a tiny robot called Spark", "a brave kitten named Poppy"],
    };
    return map[id] ?? [];
  }, [stepId]);


  const goNext = (next: string) => {
    if (next === "__COMPLETE__") {
      onComplete?.(state);
      return;
    }
    setStepId(next);
  };
  const jumpTo = (targetId: string) => {
    const t = stepsById.get(targetId as any);
    if (!t) return;

    // “Rewind” the ride to the selected step
    setStepId(targetId);
    setMessages([{ id: "m0", from: "host", text: t.host }]);
    setExtraOpen(false);
    setExtraText("");
    setIdeasOpen(false);
    setTranscriptOpen(false);
  };


  const handleChoice = (choice: WizardChoice) => {
    markComplete(stepId);
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
    markComplete(stepId);
    goNext(step.nextId);
  };

  return (
    <div className={className}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        {/* Ride Marquee */}
        <div className="mb-3 rounded-3xl border border-black/10 bg-white/60 p-3 shadow-sm">
  <div className="flex items-center justify-between gap-3">
    <div className="text-xs font-semibold tracking-wide uppercase opacity-70">Ride progress</div>
    <div className="text-xs opacity-70">{progressPct}%</div>
  </div>
  <div className="mt-2 h-2 w-full rounded-full bg-black/5 overflow-hidden">
    <div
      className="h-2 rounded-full bg-indigo-300"
      style={{ width: `${progressPct}%` }}
    />
  </div>
</div>
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
              <div className="mt-4">
                <button
                  type="button"
                  className="text-sm underline opacity-70 hover:opacity-100"
                  onClick={() => setIdeasOpen((v) => !v)}
                >
                  {ideasOpen ? "Hide ideas" : "Need ideas?"}
                </button>
              
                {ideasOpen ? (
                  <div className="mt-3 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm">
                    {step.kind === "choice" ? (
                      <>
                        <div className="font-semibold mb-2">Quick guidance</div>
                        <div className="opacity-80">
                          Pick the one that feels right. You can change it later.
                        </div>
                      </>
                    ) : null}
              
                    {step.kind === "text" ? (
                      <>
                        <div className="font-semibold mb-2">Examples</div>
                        {ideasForStep.length ? (
                          <ul className="list-disc pl-5 space-y-1 opacity-80">
                            {ideasForStep.map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        ) : (
                          <div className="opacity-80">A short phrase is perfect. You can skip if it’s optional.</div>
                        )}
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
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

                  <div className="grid gap-2 md:gap-3">
                    {step.choices.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleChoice(c)}
                        className="w-full text-left rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm hover:shadow-md hover:bg-black/[0.02] transition"
                      >
                        <div className="text-base font-semibold">{c.label}</div>
                        {c.hint ? <div className="mt-1 text-sm opacity-70">{c.hint}</div> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step.kind === "text" ? (
                <TextStep step={step} state={state} setState={setState} setMessages={setMessages} goNext={goNext} onCompleteStep={markComplete} />
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
          <div className="rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm relative z-10 pointer-events-auto">
            <div className="text-sm font-semibold">Your Park Pass</div>
            {stamps.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {stamps.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold opacity-80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-1 text-xs opacity-70">Updates as you make choices.</div>
            <div className="mt-4 space-y-3">
  <div className="rounded-2xl border border-black/10 bg-white p-4">
    <div className="flex items-center justify-between gap-2">
      <div className="text-[11px] uppercase tracking-wide opacity-60">Hero</div>
      <button
        type="button"
        className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer pointer-events-auto"
        onClick={() => jumpTo(script.initialStepId)}
        title="Edit this"
      >
        Edit
      </button>
    </div>
    <div className="mt-1 text-base font-semibold">
      {(((state as any).childName || "") as string).trim() || "—"}
    </div>
  </div>

  <div className="rounded-2xl border border-black/10 bg-white p-4">
    <div className="flex items-center justify-between gap-2">
      <div className="text-[11px] uppercase tracking-wide opacity-60">Companion</div>
      <button
        type="button"
        className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer pointer-events-auto"
        onClick={() => jumpTo("companion")}
        title="Edit this"
      >
        Edit
      </button>
    </div>
    <div className="mt-1 text-base font-semibold">
      {(((state as any).companionName || "") as string).trim() || "—"}
    </div>
  </div>

  <div className="rounded-2xl border border-black/10 bg-white p-4">
    <div className="flex items-center justify-between gap-2">
      <div className="text-[11px] uppercase tracking-wide opacity-60">Vibe</div>
      <button
        type="button"
        className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer pointer-events-auto"
        onClick={() => jumpTo("vibe")}
        title="Edit this"
      >
        Edit
      </button>
    </div>
    <div className="mt-1 text-base font-semibold">
      {String((state as any).vibe ?? "—")}
    </div>
  </div>

  <div className="rounded-2xl border border-black/10 bg-white p-4">
    <div className="flex items-center justify-between gap-2">
      <div className="text-[11px] uppercase tracking-wide opacity-60">Place</div>
      <button
        type="button"
        className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer pointer-events-auto"
        onClick={() => jumpTo("place")}
        title="Edit this"
      >
        Edit
      </button>
    </div>
    <div className="mt-1 text-base font-semibold">
      {String((state as any).place ?? "—")}
    </div>
  </div>

  <div className="rounded-2xl border border-black/10 bg-white p-4">
    <div className="flex items-center justify-between gap-2">
      <div className="text-[11px] uppercase tracking-wide opacity-60">Length</div>
      <button
        type="button"
        className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer pointer-events-auto"
        onClick={() => jumpTo("length")}
        title="Edit this"
      >
        Edit
      </button>
    </div>
    <div className="mt-1 text-base font-semibold">
      {String((state as any).length ?? "—")}
    </div>
  </div>

  <div className="pt-2 text-xs opacity-60">
    Next: we’ll use this “pass” to weave your outline and chapters in Act II.
  </div>
</div>
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
  onCompleteStep?: (id: string) => void;
}) {
  const { step, state, setState, setMessages, goNext, onCompleteStep } = props;
  const [text, setText] = useState<string>("");

  const disabled = step.required ? text.trim().length === 0 : false;

  const submit = () => {
    const value = text.trim();
    if (step.required && value.length === 0) return;

    setMessages((prev) => prev.concat([{ id: `m${prev.length}`, from: "user", text: value || "(skipped)" }]));
    const nextState = step.apply(state, value);
    setState(nextState);
    onCompleteStep?.(step.id);
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
