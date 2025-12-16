import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { Layout } from "../components/layout/Layout";
import { Button } from "../components/ui/Button";
import { useStoryState } from "../lib/state/StoryContext";
import {
  Sparkles,
  PenTool,
  ArrowRight,
  Loader2,
  RefreshCw,
  BookOpen,
  Copy,
} from "lucide-react";

function titleCase(input: string) {
  const s = (input || "").trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function readJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildErrMessage(data: any, res: Response) {
  const msg =
    (data?.message ? String(data.message) : "") ||
    (data?.error ? String(data.error) : "") ||
    `Request failed (${res.status})`;
  return msg + (data?.reqId ? ` [ref: ${data.reqId}]` : "");
}

function parseRefId(message: string): string | undefined {
  const m = message.match(/\[ref:\s*([^\]]+)\]/i);
  return m?.[1]?.trim();
}

type BusyKind = "outline" | "scenes" | "regen";

type BusyState = {
  kind: BusyKind;
  title: string;
  detail: string;
};

type UiError = {
  message: string;
  refId?: string;
};

export default function BuildPage() {
  const router = useRouter();
  const { state, setOutline, setScenes, updateScene } = useStoryState();
  const { hero, reader, scenes, outline, settings } = state;

  const [busy, setBusy] = useState<BusyState | null>(null);
  const [error, setError] = useState<UiError | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!hero.childName) router.replace("/start");
  }, [hero.childName, router]);

  const childName = useMemo(() => titleCase(hero.childName || "your hero"), [hero.childName]);

  // Prefer dedication name as the “read together with” companion label (what you expected)
  const companion = useMemo(() => {
    return (hero.readerName || "").trim() || (reader.childName || "").trim() || "you";
  }, [hero.readerName, reader.childName]);

  const sceneCountLabel = scenes.length > 0 ? `${scenes.length}-chapter` : "magical";

  const isBusy = !!busy;
  const isBusyOutline = busy?.kind === "outline";
  const isBusyScenes = busy?.kind === "scenes";
  const isBusyRegen = busy?.kind === "regen";

  const setNiceError = (msg: string) => {
    setError({ message: msg, refId: parseRefId(msg) });
  };

  const copyRef = async (refId: string) => {
    try {
      await navigator.clipboard.writeText(refId);
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      // no-op: clipboard not available
    }
  };

  const generateOutline = async () => {
    setBusy({
      kind: "outline",
      title: "Step 1 of 2: Drafting your blueprint…",
      detail:
        "We’re outlining the key moments of the story. On local quality models this can take a minute.",
    });
    setError(null);

    try {
      const payload = { hero, reader, settings };

      const res = await fetch("/api/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(buildErrMessage(data, res));

      setOutline(data?.outline ?? data);
    } catch (err) {
      setNiceError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const generateScenes = async () => {
    setBusy({
      kind: "scenes",
      title: "Step 2 of 2: Weaving your scenes…",
      detail:
        "We’re writing each chapter from the blueprint. This is the slowest step on local models—please keep this tab open.",
    });
    setError(null);

    try {
      if (!outline) throw new Error("No outline found. Draft the outline first.");

      // IMPORTANT: match API contract (hero, reader, settings, outline)
      const payload = { hero, reader, settings, outline };

      const res = await fetch("/api/generate-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(buildErrMessage(data, res));

      if (!data?.scenes || !Array.isArray(data.scenes)) {
        throw new Error("Server returned an invalid scenes payload.");
      }

      setScenes(data.scenes);
    } catch (err) {
      setNiceError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const regenerateScene = async (sceneId: string) => {
    setBusy({
      kind: "regen",
      title: "Polishing this chapter…",
      detail:
        "We’re gently rewriting the scene while keeping the hero and setting consistent. This can take a moment on local models.",
    });
    setError(null);

    try {
      if (!outline) throw new Error("No outline found. Draft the outline first.");

      const isStrict = settings.mode === "custom";

      // IMPORTANT: match API contract (hero, reader, settings, outline, sceneId)
      const payload = {
        hero,
        reader,
        settings,
        outline,
        sceneId,
        instructions: isStrict
          ? "Follow the original plan exactly."
          : "Make it more magical, warm, and child-friendly.",
      };

      const res = await fetch("/api/regenerate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(buildErrMessage(data, res));

      if (data?.scene) updateScene(data.scene);
    } catch (err) {
      setNiceError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Layout title="Weave Your Story - StorySmith">
      <div className="flex-grow flex flex-col items-center p-4 sm:p-6 max-w-5xl mx-auto w-full">
        <div className="w-full mb-6 md:mb-8 bg-gradient-to-r from-orange-50 via-amber-50 to-indigo-50 border border-orange-100 rounded-3xl shadow-sm px-6 py-6 md:px-8 md:py-7">
          <div className="text-xs font-semibold tracking-wide uppercase text-orange-600 mb-2">
            Act II · Weave the Adventure
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 mb-3">
            Welcome to the StorySmith Scene Weaver
          </h1>
          <p className="text-sm md:text-base text-stone-700 leading-relaxed max-w-3xl">
            I am the Scene Weaver, your quiet stagehand behind the curtain. Together we’ll turn
            your hero’s details into cozy chapters, one scene at a time. We’ll shape a{" "}
            {sceneCountLabel} adventure for <span className="font-semibold">{childName}</span>, read
            together with <span className="font-semibold">{titleCase(companion)}</span>.
          </p>
        </div>

        {/* Mode helper panel */}
        {settings?.buildMode === "Guided" ? (
          <div className="w-full mb-6 md:mb-8 bg-white border border-stone-200 rounded-3xl shadow-sm px-6 py-5 md:px-8 md:py-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
                  Guided Mode
                </div>
                <h2 className="mt-3 text-lg md:text-xl font-extrabold text-stone-900">
                  Your next steps (I’ll walk you through it)
                </h2>
                <p className="mt-1 text-sm md:text-base text-stone-600 max-w-3xl">
                  We’ll do this in two main clicks. If anything feels confusing, stop and I’ll help you fix it.
                </p>
              </div>
              <div className="text-sm text-stone-500">
                Tip: You can always refresh this page between steps, but avoid refreshing while the Weaver is working.
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="text-sm font-semibold text-stone-900">Step 1</div>
                <div className="text-sm text-stone-600 mt-1">Draft the outline (blueprint of scenes)</div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="text-sm font-semibold text-stone-900">Step 2</div>
                <div className="text-sm text-stone-600 mt-1">Weave the full chapters from the blueprint</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-stone-500">
              After chapters appear, you can edit the text, regenerate a chapter, then click <span className="font-semibold">Read the Book</span>.
            </div>
          </div>
        ) : (
          <div className="w-full mb-6 md:mb-8 bg-gradient-to-r from-stone-50 via-white to-stone-50 border border-stone-200 rounded-3xl shadow-sm px-6 py-5 md:px-8 md:py-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-700 bg-white/70 border border-stone-200 rounded-full px-3 py-1">
              Surprise Mode
            </div>
            <h2 className="mt-3 text-lg md:text-xl font-extrabold text-stone-900">
              Let’s weave it with fewer hints
            </h2>
            <p className="mt-1 text-sm md:text-base text-stone-600 max-w-3xl">
              Two buttons, and you’ll have a story. If you get stuck, toggle Guided next time for more hand-holding.
            </p>
          </div>
        )}
        {/* Progress panel (keeps content visible, reduces “stuck” feeling) */}
        {busy && (
          <div className="w-full mb-6 p-4 md:p-5 bg-white border border-stone-200 rounded-2xl shadow-sm">
            <div className="flex items-start gap-3">
              <Loader2 className="h-5 w-5 mt-0.5 animate-spin text-orange-500" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-stone-900">{busy.title}</div>
                <div className="text-sm text-stone-600 mt-1">{busy.detail}</div>
                <div className="text-xs text-stone-500 mt-3">
                  Tip: If you change tabs, it’s fine—just avoid refreshing this page while the
                  Weaver is working.
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold mb-1">Something went wrong</div>
                <div className="text-sm break-words">{error.message}</div>

                {error.refId && (
                  <div className="mt-3 text-sm flex items-center gap-2">
                    <span className="font-mono text-xs bg-white/60 border border-red-200 px-2 py-1 rounded-md">
                      ref: {error.refId}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyRef(error.refId!)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 underline underline-offset-2 hover:text-red-900"
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? "Copied" : "Copy ref"}
                    </button>
                  </div>
                )}
              </div>

              {/* Retry button: choose the most likely next action */}
              <div className="flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!outline) return generateOutline();
                    if (outline && scenes.length === 0) return generateScenes();
                    return generateOutline();
                  }}
                  disabled={isBusy}
                >
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* OUTLINE STEP */}
        {!outline && (
          <div className={"w-full text-center py-10 bg-white rounded-3xl border border-stone-200 shadow-sm px-6 " + (isBusy ? "opacity-70" : "")}>
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">First, let's sketch the plan.</h2>
            <p className="text-stone-600 mb-8 max-w-lg mx-auto">
              We’ll outline the key moments of the story based on your choices.
            </p>
            <Button size="lg" onClick={generateOutline} disabled={isBusy}>
              {isBusyOutline ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Drafting…
                </>
              ) : (
                <>
                  Draft the Outline <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* BLUEPRINT STEP */}
        {outline && scenes.length === 0 && (
          <div className={"w-full animate-in slide-in-from-bottom-4 duration-500 " + (isBusy ? "opacity-70" : "")}>
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-indigo-900">The Story Blueprint</h2>
                  <p className="text-indigo-700 text-sm">
                    Here’s the plan. If it feels right, we’ll weave the full chapters next.
                  </p>
                </div>

                <Button
                  onClick={generateScenes}
                  className="shadow-lg shadow-indigo-200"
                  disabled={isBusy}
                >
                  {isBusyScenes ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Weaving…
                    </>
                  ) : (
                    <>
                      Looks Good! Weave Scenes <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="p-6 space-y-4">
                {outline.scenes.map((s: any) => (
                  <div key={s.id} className="flex gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full border border-stone-200 flex items-center justify-center font-bold text-stone-400 text-xs">
                      {s.index}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-stone-800 text-lg mb-1">{s.title}</h3>
                      <p className="text-stone-600 text-sm leading-relaxed">{s.summary}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-stone-50 border-t border-stone-100 text-center">
                <p className="text-xs text-stone-500">
                  Not quite right?{" "}
                  <button
                    onClick={generateOutline}
                    className={"underline hover:text-stone-700 " + (isBusy ? "opacity-60 pointer-events-none" : "")}
                    disabled={isBusy as any}
                  >
                    Re-roll the outline
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SCENES STEP */}
        {scenes.length > 0 && (
          <div className={"w-full animate-in slide-in-from-bottom-4 duration-500 " + (isBusy ? "opacity-90" : "")}>
            <div className="mt-4 md:mt-6 bg-stone-50/70 border border-stone-200 rounded-3xl px-4 md:px-6 py-6 md:py-8">
              <div className="mb-6 md:mb-8 text-center md:text-left">
                <h2 className="text-xl font-bold text-stone-800">Your Chapters So Far</h2>
                <p className="text-stone-500 text-sm mt-1">
                  Each card below is a chapter of tonight’s story. You can tweak the words or ask the Scene Weaver to gently rewrite them.
                </p>
              </div>

              <div className="space-y-8">
                {scenes.map((scene: any) => (
                  <div
                    key={scene.id}
                    className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-100 transition-shadow hover:shadow-md"
                  >
                    <div className="text-xs font-semibold tracking-wide uppercase text-orange-500 mb-1">
                      Scene {scene.index}
                    </div>

                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                      <h3 className="text-lg md:text-xl font-bold text-stone-900">{scene.title}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => regenerateScene(scene.id)}
                          disabled={isBusy}
                          title="Ask Scene Weaver to try again"
                        >
                          {isBusyRegen ? (
                            <Loader2 className="h-4 w-4 animate-spin text-stone-500" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-stone-400 hover:text-stone-600" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <textarea
                      className="w-full h-auto min-h-[160px] p-4 rounded-xl border border-stone-200 text-lg leading-relaxed text-stone-700 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 focus:outline-none resize-none bg-stone-50/30"
                      value={scene.text}
                      onChange={(e) => updateScene({ ...scene, text: e.target.value })}
                    />

                    <div className="flex justify-between items-start mt-3">
                      <p className="text-xs text-stone-500 italic max-w-md">
                        The Scene Weaver will keep your hero and setting the same, but smooth the words.
                      </p>
                      <div className="text-xs font-semibold text-stone-300 uppercase tracking-widest flex items-center gap-1">
                        <PenTool className="h-3 w-3" /> Editable
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col items-center gap-4 pt-8 border-t border-stone-200">
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-12 shadow-xl shadow-orange-200 text-lg"
                  onClick={() => router.push("/preview")}
                  disabled={isBusy}
                >
                  <BookOpen className="mr-2 h-6 w-6" /> Read the Book
                </Button>
                <p className="text-stone-500 text-sm">Ready to see the final storybook?</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}