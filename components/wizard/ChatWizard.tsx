import React, { useEffect, useMemo, useRef, useState } from "react";








import { Button } from "../ui/Button";








import type { WizardMessage, WizardScript, WizardStep, WizardChoice, WizardUploadedFile } from "./types";

















type Props<TState> = {








  script: WizardScript<TState>;








  initialState: TState;








  onComplete: (state: TState) => void;








  className?: string;








  uiMode?: "default" | "immersive";








};

















/** Tiny helpers (keep inline, minimal deps) */








function hasText(x: any) {








  return typeof x === "string" && x.trim().length > 0;








}

















export function ChatWizard<TState>(props: Props<TState>) {








  const { script, initialState, onComplete, className, uiMode = "default" } = props;








  const isImmersive = uiMode === "immersive";

















  const [state, setState] = useState<TState>(initialState as TState);








  const [stepId, setStepId] = useState<string>(script.initialStepId);








  const [messages, setMessages] = useState<WizardMessage[]>([]);








  const [completed, setCompleted] = useState<string[]>([]);








  








  const hasStamp = (needle: string) =>








    completed.some((id) => String(id).toLowerCase().includes(needle));

















  const [ideasOpen, setIdeasOpen] = useState(false);








  const [extraOpen, setExtraOpen] = useState(false);








  const [extraText, setExtraText] = useState("");








  const [transcriptOpen, setTranscriptOpen] = useState(false);








  const [schemaOpen, setSchemaOpen] = useState(false);

















  // [SS UX] Host typewriter state (safe, self-contained)








  const [hostTyped, setHostTyped] = useState("");








  const [hostIsTyping, setHostIsTyping] = useState(false);








  const hostFullRef = useRef<string>("");








  const stepsById = useMemo(() => {








    const map = new Map<string, WizardStep<TState>>();








    for (const s of script.steps) map.set(s.id, s as any);








    return map;








  }, [script.steps]);

















  const stepIndex = useMemo(() => {








    const idx = script.steps.findIndex((s: any) => s.id === stepId);








    return idx < 0 ? 0 : idx;








  }, [script.steps, stepId]);

















  const totalSteps = script.steps.length;








  const progressPct = Math.max(0, Math.min(100, Math.round(((stepIndex + 1) / totalSteps) * 100)));

















  const step = stepsById.get(stepId) as WizardStep<TState> | undefined;

















  const ideasForStep = useMemo(() => {








    if (!step) return [];








    // very light, no big system yet








    if (step.id === "heroName") return ["Scarlett", "Arlo", "Chantal", "Captain Sunny"];








    if (step.id === "readerName") return ["Adam", "Grandma Ginette", "Ayla", "Friend"];








    if (step.id === "relationshipCustom") return ["Aunt and niece", "Coach and team", "Best friends"];








    if (step.id === "companionName") return ["A baby axolotl named Billy", "A tiny robot named Spark", "A brave kitten named Luna"];








    return [];








  }, [step]);

















  const done = (id: string) => completed.includes(id);

















  const stamps = useMemo(() => {








    const out: string[] = [];








    if (done("heroName")) out.push("Hero set");








    if (done("heroPhoto") && hasText((state as any).heroPhotoDataUrl)) out.push("Photo set");








    if (done("companionPick") || done("companionName") || done("companion")) out.push("Companion set");








    if (done("vibe")) out.push("Mood set");








    if (done("place")) out.push("Setting set");








    if (done("length")) out.push("Length set");








    return out.slice(0, 6);








  }, [completed, state]);

















  const markComplete = (id: string) => {








    setCompleted((prev) => (prev.includes(id) ? prev : prev.concat([id])));








  };

















  /**








   * IMPORTANT:








   * React state updates are async. If we call onComplete(state) immediately after setState(nextState),








   * we can complete with stale state. So goNext accepts an optional override.








   */








  const goNext = (next: string, nextStateOverride?: TState) => {








    const effectiveState = (nextStateOverride ?? state) as TState;

















    if (next === "__COMPLETE__") {








      onComplete(effectiveState);








      return;








    }








    setIdeasOpen(false);








    setExtraOpen(false);








    setExtraText("");








    setStepId(next);








  };

















  const jumpTo = (id: string) => {








    setIdeasOpen(false);








    setExtraOpen(false);








    setExtraText("");








    setStepId(id);








  };

















  useEffect(() => {








    if (!step) return;








    setMessages((prev) => {








      const last = prev[prev.length - 1];








      const hostText = String((step as any).host ?? "");








      if (last && last.from === "host" && last.text === hostText) return prev;








      return prev.concat([{ id: `m${prev.length}`, from: "host", text: hostText }]);








    });








    // eslint-disable-next-line react-hooks/exhaustive-deps








  }, [stepId]);

















  // ============================








  // Hooks MUST be declared before any early return (rules-of-hooks).








  // Gate behavior inside effects instead of gating hook calls.








  // ============================

















  const hostFull = String((step as any)?.host ?? "");

















  useEffect(() => {








    // Only listen on "say" steps (Continue screens)








    if (!step || step.kind !== "say") return;

















    const onKeyDown = (e: KeyboardEvent) => {








      if (e.key !== "Enter") return;

















      // Do not hijack Enter if user is typing in a form control








      const t = e.target as HTMLElement | null;








      const tag = t?.tagName?.toLowerCase();








      if (tag === "input" || tag === "textarea" || (t as any)?.isContentEditable) return;

















      e.preventDefault();








      // Inline continue to avoid deps issues








      markComplete(stepId);








      goNext((step as any).nextId, state);








    };

















    window.addEventListener("keydown", onKeyDown, true);

















  return () => window.removeEventListener("keydown", onKeyDown, true);








  }, [stepId, step?.kind, (step as any)?.nextId, state]);

















// [SS UX] Host typewriter (all host lines)








  useEffect(() => {








    hostFullRef.current = hostFull;

















    // Reset for every step transition / host change








    setHostTyped("");

















    if (!hostFull.trim()) {








      setHostIsTyping(false);








      return;








    }

















    const preferReduced =








      typeof window !== "undefined" &&








      !!(window as any).matchMedia &&








      (window as any).matchMedia("(prefers-reduced-motion: reduce)").matches;

















    if (preferReduced) {








      setHostTyped(hostFull);








      setHostIsTyping(false);








      return;








    }

















    let cancelled = false;








    let i = 0;








    let isTyping = true;

















    setHostIsTyping(true);

















    const tick = () => {








      if (cancelled) return;

















      i = Math.min(hostFull.length, i + 1);








      setHostTyped(hostFull.slice(0, i));

















      if (i >= hostFull.length) {








        isTyping = false;








        setHostIsTyping(false);








        return;








      }

















      window.setTimeout(tick, 12);








    };

















    window.setTimeout(tick, 60);

















    const onKeyDown = (e: KeyboardEvent) => {








      const isSpace = e.key === " " || e.code === "Space" || e.key === "Spacebar";








      if (!isSpace) return;








      if (!isTyping) return;

















      e.preventDefault();








      e.stopPropagation();

















      setHostTyped(hostFullRef.current);








      isTyping = false;








      setHostIsTyping(false);








    };

















    window.addEventListener("keydown", onKeyDown, true);

















  return () => {








      cancelled = true;








      window.removeEventListener("keydown", onKeyDown, true);








    };








  }, [stepId, hostFull]);








  if (!step) {








    return (








      <div className={className}>








        <div className="mx-auto w-full max-w-3xl px-4 py-10">








          <div className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-6 shadow-sm shadow-indigo-100/50">








            <div className="text-lg font-semibold">Wizard Error</div>








            <div className="mt-2 text-sm opacity-70">








              Could not find step <span className="font-mono">{stepId}</span>.








            </div>








            <div className="mt-4">








              <Button onClick={() => jumpTo(script.initialStepId)}>Restart</Button>








            </div>








          </div>








        </div>








      </div>








    );








  }

















  const handleChoice = (choice: WizardChoice) => {








    if (step.kind !== "choice") return;

















    const nextState = (step.kind === "choice" ? (step.apply as any)(state, choice) : state) as TState;

















    let finalState = nextState;








    if (step.kind === "choice" && step.extraFlavor?.apply && extraOpen && extraText.trim().length > 0) {








      finalState = (step.extraFlavor.apply as any)(finalState, extraText.trim()) as TState;








      setMessages((prev) =>








        prev.concat([{ id: `m${prev.length}`, from: "user", text: `(extra)\n${extraText.trim()}` }])








      );








    }

















    setState(finalState);

















    const nextId =








      typeof step.nextId === "function" ? (step.nextId as any)(finalState, choice) : (step.nextId as string);

















    markComplete(stepId);








    setMessages((prev) => prev.concat([{ id: `m${prev.length}`, from: "user", text: choice.label }]));








    goNext(nextId, finalState);








  };

















  const handleSayContinue = () => {








    if (step.kind !== "say") return;








    markComplete(stepId);








    goNext(step.nextId, state);








  };

















  return (








    <div className={className}>








      <div className={"mx-auto w-full " + (isImmersive ? "max-w-4xl" : "max-w-6xl") + " px-4 py-6"}>








        {/* Ride Marquee */}








        <div className={"mb-3 rounded-3xl border border-black/10 bg-white/60 p-3 shadow-sm" + (isImmersive ? " hidden" : "")}>








          <div className={"flex items-center justify-between gap-3" + (isImmersive ? " hidden" : "")}>








            <div className={"text-xs font-semibold tracking-wide uppercase opacity-70" + (isImmersive ? " hidden" : "")}>Ride progress</div>








            <div className={"text-xs opacity-70" + (isImmersive ? " hidden" : "")}>{progressPct}%</div>








          </div>








          <div className="mt-2 h-2 w-full rounded-full bg-black/5 overflow-hidden">








            <div className={"h-2 rounded-full bg-indigo-300" + (isImmersive ? " hidden" : "")} style={{ width: `${progressPct}%` }} />








          </div>








        </div>

















        <div className="mb-4 rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm">








          <div className="flex items-start justify-between gap-4">








            <div>








              <div className="text-xs uppercase tracking-wide opacity-70">Act I - Forge the Hero</div>








              <div className="mt-1 text-2xl font-semibold">{script.persona.name}</div>








              {isImmersive ? (








                <div className="mt-2 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">








                  Immersive UI








                </div>








              ) : null}








              {false ? <div className="mt-1 text-sm opacity-80">{script.persona.title}</div> : null}








              {script.persona.subtitle ? <div className="mt-2 text-sm opacity-90">{script.persona.subtitle}</div> : null}








            </div>

















            <div className="min-w-[200px] text-right">








              <div className={"text-sm opacity-80" + (isImmersive ? " hidden" : "")}>








                Step {Math.min(stepIndex + 1, totalSteps)} of {totalSteps}








              </div>








              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10">








                <div className={"h-full bg-black/30" + (isImmersive ? " hidden" : "")} style={{ width: `${progressPct}%` }} />








              </div>








              <div className={"mt-1 text-xs opacity-60" + (isImmersive ? " hidden" : "")}>{progressPct}%</div>








            </div>








          </div>

















          <div className="mt-4 flex items-center justify-between gap-3">








            <div className="text-sm opacity-70"><span className={(isImmersive ? "hidden" : "")}>Ride Mode: one moment at a time. Transcript is optional.</span></div>








            <button








              type="button"








              className="text-sm underline opacity-70 hover:opacity-100"








              onClick={() => setTranscriptOpen((v) => !v)}








            >








              <span className={(isImmersive ? "hidden" : "")}>{transcriptOpen ? "Hide transcript" : "Show transcript"}</span>








            </button>








          </div>








        </div>

















        <div className={"grid gap-4 " + (isImmersive ? "" : "lg:grid-cols-[1fr_340px]")}>








          {/* Stage */}








          <div>








            <div className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-6 shadow-sm shadow-indigo-100/50">








                            <div data-ss-stage-header className="flex flex-wrap items-start justify-between gap-3">
<div className="mb-1 inline-flex shrink-0 items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700">








                Now boarding...</div>
{isImmersive && (
  <div data-ss-host-anchor className="mb-1 flex items-center gap-3 shrink-0">
    <div className="h-10 w-10 shrink-0 rounded-full bg-black/10 flex items-center justify-center text-xs font-semibold">SS</div>
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide opacity-60">Your Host</div>
      <div className="text-sm font-semibold leading-tight">The Sculptor of Souls</div>
    </div>
  </div>
)}
              </div>









              <div className="text-xs uppercase tracking-wide opacity-60">{script.persona.name} says</div>








              <div className="mt-2 text-lg md:text-xl leading-relaxed">








  <span>{hostIsTyping ? hostTyped : String((step as any)?.host ?? "")}</span>








  {hostIsTyping ? (








    <span








      aria-hidden="true"








      className={"inline-block align-baseline ml-1 w-[2px] h-[1.1em] bg-stone-700/70 " + (hostIsTyping ? "animate-pulse" : "opacity-0")}








    />








  ) : null}








</div>








              <div className="mt-3 text-sm opacity-60">You can change choices later.</div>
</div>
{step.kind === "say" && isImmersive ? (
  <div className="mt-4 flex justify-end" data-ss-stage-continue>
    <Button onClick={handleSayContinue}>Continue</Button>
  </div>
) : null}
<div>








              <div className="mt-3 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm" aria-live="polite" data-ss-next-hint-box style={isImmersive ? { display: "none" } : undefined}>








                <div className="text-xs uppercase tracking-wide opacity-60">What happens next</div>








                {!isImmersive && (


                <div className={"mt-1 opacity-80" + (isImmersive ? " hidden" : "")}>








                  {step.kind === "choice"








                    ? "Pick one option below - I'll stamp your Park Pass and we'll continue."








                    : step.kind === "text"








                    ? "Type your answer and press Enter (or click Continue)."








                    : step.kind === "upload"








                    ? "Upload a photo - you'll see an \"Added\" badge and preview. Then press Enter or Continue."








                    : "Click Continue when you're ready."}








                </div>


                )}








              </div>

















              <div className={"mt-4" + (isImmersive ? " hidden" : "")}>








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








                        <div className="opacity-80">Pick the one that feels right. You can change it later.</div>








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








                          <div className="opacity-80">A short phrase is perfect. You can skip if it's optional.</div>








                        )}








                      </>








                    ) : null}








                  </div>








                ) : null}








              </div>








            </div>

















            <div className="mt-4 rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm" style={(step.kind === "say" && isImmersive) ? { display: "none" } : undefined}>








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

















              {step.kind === "upload" ? (








                <UploadStep key={step.id}








                  step={step}








                  state={state}








                  setState={setState}








                  setMessages={setMessages}








                  goNext={goNext}








                  onCompleteStep={markComplete}








                onUploadReceived={() => setSchemaOpen(true)}








                />








              ) : null}

















              {step.kind === "text" ? (








                <TextStep key={step.id}








                  step={step}








                  state={state}








                  setState={setState}








                  setMessages={setMessages}








                  goNext={goNext}








                  onCompleteStep={markComplete}








                />








              ) : null}








            </div>








            {/* Transcript Drawer */}








            {transcriptOpen ? (








              <div className={"mt-4 rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm" + (isImmersive ? " hidden" : "")}>








                <div className="text-sm font-semibold">Transcript</div>








                <div className="mt-3 space-y-3">








                  {messages.map((m, idx) => (








                    <div key={m.id} className={m.from === "host" ? "flex justify-start" : "flex justify-end"}>








                      <div className="max-w-[90%]">








                        {m.from === "host" && (idx === 0 || messages[idx - 1]?.from === "user") ? (








                          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500/80">








                            Now boarding...</div>








                        ) : null}

















                        <div








                          className={








                            m.from === "host"








                              ? "max-w-[90%] rounded-3xl border border-black/10 bg-white/80 backdrop-blur p-4 shadow-sm text-stone-900"








                              : "max-w-[90%] rounded-3xl border border-indigo-200 bg-indigo-600 p-4 shadow-sm text-white"








                          }








                        >








                          {m.text}








                        </div>








                      </div>








                    </div>








                  ))}








                </div>








              </div>








            ) : null}








          </div>

















          {/* Park Pass */}








          {!isImmersive && (
          <div className="rounded-3xl border border-black/10 bg-white/70 p-5 shadow-sm relative z-10 pointer-events-auto">








            <div className="flex items-center justify-between gap-2">








              {!isImmersive && (


              <div className={"text-sm font-semibold" + (isImmersive ? " hidden" : "")}>Your Park Pass</div>








              )}


              <button








                type="button"








                className="text-xs underline opacity-70 hover:opacity-100"








                onClick={() => setSchemaOpen((v) => !v)}








              >








                {schemaOpen ? "Hide pass details" : "Show pass details"}








              </button>








            </div>

















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

















            {schemaOpen ? (








              <div className="mt-3 grid grid-cols-1 gap-3">








  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">








    <div className="rounded-2xl border border-black/10 bg-white p-4">








      <div className="text-[11px] uppercase tracking-wide opacity-60">Hero</div>








      <div className="mt-1 text-base font-semibold">








        {String((((state as any).childName || "") as string).trim() || "-")}








      </div>








    </div>

















    <div className="rounded-2xl border border-black/10 bg-white p-4">








      <div className="text-[11px] uppercase tracking-wide opacity-60">Companion</div>








      <div className="mt-1 text-base font-semibold">








        {String((((state as any).companionName || "") as string).trim() || "-")}








      </div>








    </div>

















    <div className="rounded-2xl border border-black/10 bg-white p-4">








      <div className="text-[11px] uppercase tracking-wide opacity-60">Photo</div>








      <div className="mt-1 text-base font-semibold">








        {((state as any).heroPhotoDataUrl ? "Added" : "-")}








      </div>








    </div>








  </div>

















  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">








    <div className="rounded-2xl border border-black/10 bg-white p-4">








      <div className="text-[11px] uppercase tracking-wide opacity-60">Vibe</div>








      <div className="mt-1 text-base font-semibold">








        {hasStamp("vibe") ? String((state as any).vibe ?? "-") : "-"}








      </div>








    </div>

















    <div className="rounded-2xl border border-black/10 bg-white p-4">








      <div className="text-[11px] uppercase tracking-wide opacity-60">Place</div>








      <div className="mt-1 text-base font-semibold">








        {hasStamp("place") ? String((state as any).place ?? "-") : "-"}








      </div>








    </div>

















    <div className="rounded-2xl border border-black/10 bg-white p-4">








      <div className="text-[11px] uppercase tracking-wide opacity-60">Length</div>








      <div className="mt-1 text-base font-semibold">








        {hasStamp("length") ? String((state as any).length ?? "-") : "-"}








      </div>








    </div>








  </div>

















  <details className="rounded-2xl border border-black/10 bg-white p-4">








    <summary className="cursor-pointer text-xs font-semibold opacity-70">








      Advanced (raw JSON)








    </summary>








    <pre className="mt-3 max-h-72 overflow-auto rounded-2xl border border-black/10 bg-white p-3 text-[11px] font-mono opacity-80 whitespace-pre-wrap">








{JSON.stringify(state, null, 2)}








    </pre>








  </details>








</div>








            ) : null}

















            <div className="mt-4 space-y-3">








              <div className="rounded-2xl border border-black/10 bg-white p-4">








                <div className="flex items-center justify-between gap-2">








                  <div className="text-[11px] uppercase tracking-wide opacity-60">Hero</div>








                  <button








                    type="button"








                    className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer pointer-events-auto"








                    onClick={() => jumpTo("heroName")}








                    title="Edit this"








                  >








                    Edit








                  </button>








                </div>








                <div className="mt-1 text-base font-semibold">








                  {(((state as any).childName || "") as string).trim() || "-"}








                </div>








              </div>

















              <div className="rounded-2xl border border-black/10 bg-white p-4">








                <div className="flex items-center justify-between gap-2">








                  <div className="text-[11px] uppercase tracking-wide opacity-60">Photo</div>








                  <button








                    type="button"








                    className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer pointer-events-auto"








                    onClick={() => jumpTo("heroPhoto")}








                    title="Upload / replace photo"








                  >








                    Edit








                  </button>








                </div>








                <div className="mt-1 text-base font-semibold">








                  {hasText((state as any).heroPhotoDataUrl) ? "Added" : "-"}








                </div>








                {hasText((state as any).heroPhotoDataUrl) ? (








                  <img








                    src={String((state as any).heroPhotoDataUrl)}








                    alt="Hero photo preview"








                    className="mt-2 h-20 w-20 rounded-2xl object-cover border border-black/10"








                  />








                ) : null}








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








                  {(((state as any).companionName || "") as string).trim() || "-"}








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








                <div className="mt-1 text-base font-semibold">{hasStamp("vibe") ? String((state as any).vibe ?? "-") : "-"}</div>








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








                <div className="mt-1 text-base font-semibold">{hasStamp("place") ? String((state as any).place ?? "-") : "-"}</div>








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








                <div className="mt-1 text-base font-semibold">{hasStamp("length") ? String((state as any).length ?? "-") : "-"}</div>








              </div>

















              <div className="pt-2 text-xs opacity-60">








                Next: we'll use this pass to weave your outline and chapters in Act II.








              </div>








            </div>








          </div>
          )}








        </div>








      </div>








    </div>








  );








}

















function UploadStep<TState>(props: {








  step: Extract<WizardStep<TState>, { kind: "upload" }>;








  state: TState;








  setState: (s: TState) => void;








  setMessages: React.Dispatch<React.SetStateAction<WizardMessage[]>>;








  goNext: (next: string, nextStateOverride?: TState) => void;








  onCompleteStep?: (id: string) => void;








  onUploadReceived?: () => void;








}) {








  const { step, state, setState, setMessages, goNext, onCompleteStep, onUploadReceived } = props;








  const [busy, setBusy] = useState(false);








  const [error, setError] = useState<string | null>(null);








  const [uploaded, setUploaded] = useState<WizardUploadedFile | null>(null);








  const [uploadedState, setUploadedState] = useState<TState | null>(null);








  const inputRef = useRef<HTMLInputElement | null>(null);

















  const accept = step.accept ?? "image/*";








  const onPick = async (file: File | null) => {








    setError(null);








    if (!file) return;

















    setBusy(true);








    try {








      const dataUrl = await new Promise<string>((resolve, reject) => {








        const reader = new FileReader();








        reader.onerror = () => reject(new Error("Could not read file."));








        reader.onload = () => resolve(String(reader.result ?? ""));








        reader.readAsDataURL(file);








      });

















      const payload: WizardUploadedFile = {








        name: file.name,








        type: file.type,








        size: file.size,








        dataUrl,








      };

















      const nextState = (step.apply as any)(state, payload) as TState;








      setState(nextState);








      setUploaded(payload);








      setUploadedState(nextState);

















      setMessages((prev) =>








        prev.concat([{ id: "m" + prev.length, from: "user", text: "Photo added: " + file.name }])








      );

















      onCompleteStep?.(step.id);

















      // IMPORTANT: do NOT auto-advance; show preview + explicit Continue








      // so the user has visible confirmation.








    } catch (e) {








      setError(e instanceof Error ? e.message : String(e));








    } finally {








      setBusy(false);








      if (inputRef.current) inputRef.current.value = "";








    }








  };

















  useEffect(() => {








    if (!uploaded) return;

















    








    onUploadReceived?.();

















    const onKeyDown = (e: KeyboardEvent) => {








      if (e.key !== "Enter") return;

















      // Do not hijack Enter if user is typing in a form control








      const t = e.target as HTMLElement | null;








      const tag = t?.tagName?.toLowerCase();








      if (tag === "input" || tag === "textarea" || (t as any)?.isContentEditable) return;

















      e.preventDefault();








      goNext(step.nextId, uploadedState ?? state);








    };

















    window.addEventListener("keydown", onKeyDown);

















  return () => window.removeEventListener("keydown", onKeyDown);








  }, [uploaded, step.nextId, uploadedState, state, goNext]);

















  return (








    <div className="space-y-3">








      {step.helpText ? (








        <div className="rounded-2xl border border-black/10 bg-white/70 p-4 text-sm opacity-80">








          {step.helpText}








        </div>








      ) : null}

















      <div className="rounded-2xl border border-black/10 bg-white p-4">








        <div className="flex items-center justify-between gap-3">








          <div className="text-sm font-semibold flex items-center gap-2">








  <span>Upload a photo</span>








  {uploaded ? (








    <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">








      Added








    </span>








  ) : null}








</div>








          <button








            type="button"








            className="text-sm underline opacity-70 hover:opacity-100 disabled:opacity-60"








            onClick={() => inputRef.current?.click()}








            disabled={busy}








          >








            Choose photo








          </button>








        </div>

















        <input








          ref={inputRef}








          type="file"








          accept={accept}








          onChange={(e) => onPick(e.target.files?.[0] ?? null)}








          className="sr-only"








          disabled={busy}








        />

















        <div className="mt-2 text-xs opacity-60">








          Tip: a clear face photo works best. You can replace it later using Edit.








        </div>

















        {uploaded ? (








          <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-4">








            <div className="text-sm font-semibold">Photo received</div>








            <div className="mt-1 text-xs opacity-70">








              Saved for your story so your hero stays recognizable from page to page.








            </div>

















            <div className="mt-3 flex items-start gap-3">








              <img








                src={uploaded.dataUrl}








                alt="Uploaded photo preview"








                className="h-24 w-24 rounded-2xl object-cover border border-black/10"








              />








              <div className="text-sm">








                <div className="font-semibold">{uploaded.name}</div>








                <div className="mt-1 text-xs opacity-70">








                  {uploaded.type || "image"} - {Math.max(1, Math.round(uploaded.size / 1024))} KB








                </div>








              </div>








            </div>

















            <div className="mt-4 flex justify-end">








              <Button onClick={() => goNext(step.nextId, uploadedState ?? state)}>Continue</Button>








            </div>








          </div>








        ) : null}








      </div>

















      {error ? <div className="text-sm text-red-600">{error}</div> : null}

















      {!step.required ? (








        <div className="flex justify-end">








          <button








            type="button"








            className="text-sm underline opacity-70 hover:opacity-100 disabled:opacity-60"








            onClick={() => {








              setMessages((prev) =>








                prev.concat([{ id: "m" + prev.length, from: "user", text: "(skipped upload)" }])








              );








              onCompleteStep?.(step.id);








              goNext(step.nextId, state);








            }}








            disabled={busy}








          >








            Skip for now








          </button>








        </div>








      ) : null}








    </div>








  );








}

















function TextStep<TState>(props: {








  step: Extract<WizardStep<TState>, { kind: "text" }>;








  state: TState;








  setState: (s: TState) => void;








  setMessages: React.Dispatch<React.SetStateAction<WizardMessage[]>>;








  goNext: (next: string, nextStateOverride?: TState) => void;








  onCompleteStep?: (id: string) => void;








  onUploadReceived?: () => void;








}) {








  const { step, state, setState, setMessages, goNext, onCompleteStep, onUploadReceived } = props;

















  const [value, setValue] = useState("");








  const [error, setError] = useState<string | null>(null);








  const submit = () => {








    const v = value.trim();








    if (step.required && v.length === 0) {








      setError("Please enter a value.");








      return;








    }

















    const nextState = (step.apply as any)(state, v) as TState;








    setState(nextState);








    setMessages((prev) => prev.concat([{ id: `m${prev.length}`, from: "user", text: v || "(skipped)" }]));








    onCompleteStep?.(step.id);








    goNext(step.nextId, nextState);








  };

















  return (








    <div className="space-y-3">








      <div className="flex flex-col gap-2">








        <input








          value={value}








          onChange={(e) => setValue(e.target.value)}








          onKeyDown={(e) => {








            if (e.key === "Enter") {








              e.preventDefault();








              submit();








            }








          }}








          placeholder={step.placeholder ?? "Type here..."}








          className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-base outline-none"








        />








        {error ? <div className="text-sm text-red-600">{error}</div> : null}








      </div>

















      <div className="flex justify-end">








        <Button onClick={submit}>Continue</Button>








      </div>








    </div>








  );








}


