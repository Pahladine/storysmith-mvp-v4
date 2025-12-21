import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { useStoryState } from '../lib/state/StoryContext';
import { StoryScene } from '../lib/models/types';
import { ArrowLeft, BookOpen, Printer, Sun, Moon, Download, ChevronLeft, ChevronRight, RefreshCw, Copy } from 'lucide-react';
import { buildSessionFromStoryState } from '../lib/session/exportSession';

/**
 * Renders the content of a single StoryScene. Reusable for both screen and print views.
 */
interface StoryPageViewProps {
  scene: StoryScene;
  isScreenView: boolean;
  theme?: 'day' | 'night';
}

const StoryPageView: React.FC<StoryPageViewProps> = ({ scene, isScreenView, theme = 'day' }) => {
  // Theme-based styling for screen view
  const isNight = isScreenView && theme === 'night';
  
  // Refined card styling for a "book page" feel
  const cardBg = isNight 
    ? 'bg-slate-900 border border-slate-800' // Night: Dark card, subtle border
    : 'bg-white border border-stone-100';    // Day: White card, subtle border
    
  const headingColor = isNight ? 'text-slate-200' : 'text-stone-900';
  const textColor = isNight ? 'text-slate-300' : 'text-stone-800';
  const promptBg = isNight ? 'bg-slate-800' : 'bg-stone-50';
  const promptBorder = isNight ? 'border-slate-700' : 'border-stone-200';
  const promptText = isNight ? 'text-slate-500' : 'text-stone-500';

  // Layout classes
  const containerClasses = isScreenView
    ? `story-page-section w-full mb-8 transition-all duration-500 ease-in-out ${cardBg} shadow-lg rounded-xl md:rounded-2xl p-6 md:p-10`
    : 'story-page-section shadow-none border-none p-0 mb-8 w-full bg-white'; // Print overrides

  const titleClasses = isScreenView
    ? `text-2xl md:text-3xl mb-4 text-center font-serif font-bold ${headingColor}`
    : 'text-xl mb-2 font-serif font-bold text-stone-900';

  const textClasses = isScreenView
    ? `text-lg md:text-xl leading-relaxed md:leading-loose font-serif ${textColor}`
    : 'text-base leading-relaxed text-stone-700';

  return (
    <div className={containerClasses}>
      <h2 className={titleClasses}>
        {isScreenView ? scene.title : `Chapter ${scene.index}: ${scene.title}`}
      </h2>
      
      {/* Story Text */}
      <div className={`whitespace-pre-wrap ${textClasses}`}>
        {scene.text}
      </div>

      {/* Illustration Prompt (screen only, visually distinct but low priority) */}
      <div className={`print-hidden mt-8 pt-4 border-t border-dashed ${promptBorder} text-sm ${promptText} rounded-lg ${promptBg} p-4`}>
        <span className="font-bold uppercase tracking-wider text-xs block mb-1 opacity-70">
          Illustration Prompt
        </span> 
        <span className="italic opacity-90">{scene.illustrationPrompt}</span>
      </div>
    </div>
  );
};

type Theme = 'day' | 'night';

const PreviewPage: React.FC = () => {
  const router = useRouter();
  const { state } = useStoryState();
  
  const { hero, scenes } = state;

  // Local state for active scene and theme
  const initialSceneId = scenes.length > 0 ? scenes[0].id : null;
  const [activeSceneId, setActiveSceneId] = useState<string | null>(initialSceneId);
  const [theme, setTheme] = useState<Theme>('day');

  
const [reviewMode, setReviewMode] = useState(false);
const [inspectorOpen, setInspectorOpen] = useState(false);
const [toast, setToast] = useState<string | null>(null);

const copyToClipboard = async (text: string, label: string) => {
  try {
    const payload = String(text ?? "");
    if (!payload.trim()) {
      setToast("Nothing to copy.");
      window.setTimeout(() => setToast(null), 1200);
      return;
    }

    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload);
    } else {
      const ta = document.createElement("textarea");
      ta.value = payload;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setToast(`${label} copied.`);
    window.setTimeout(() => setToast(null), 1200);
  } catch (e) {
    console.error("Copy failed:", e);
    setToast("Copy failed.");
    window.setTimeout(() => setToast(null), 1400);
  }
};
// 1. Redirect if prerequisites are missing
  useEffect(() => {
    if (!hero.childName || scenes.length === 0) {
      router.replace('/build');
    }
    // Set active scene ID on initial load if not already set
    if (!activeSceneId && scenes.length > 0) {
      setActiveSceneId(scenes[0].id);
    }
  }, [hero.childName, scenes.length, router, activeSceneId]);
  
  // Derived state
  const totalPages = scenes.length;
  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];
  const activeIndex = activeScene ? activeScene.index - 1 : 0;
  const isFirstPage = activeIndex === 0;
  const isLastPage = activeIndex === totalPages - 1;

  const handleNext = () => {
    if (!isLastPage && activeIndex < totalPages - 1) {
      setActiveSceneId(scenes[activeIndex + 1].id);
    }
  };
  
  const handlePrev = () => {
    if (!isFirstPage && activeIndex > 0) {
      setActiveSceneId(scenes[activeIndex - 1].id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    try {
      const session = buildSessionFromStoryState(state);
      const jsonString = JSON.stringify(session, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const safeId = state.storyId || `story-${Date.now()}`;
      link.href = url;
      link.download = `storysmith-${safeId}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate or download JSON file:", e);
    }
  };

  const handleDownloadHtml = () => {
    try {
      const childName = hero.childName || "Hero";
      
      // Build the complete HTML string with premium book styling
      let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Complete Story of ${childName}</title>
    <style>
        /* Base styles for screen viewing */
        body {
            background-color: #f5f1e9;
            font-family: Georgia, 'Times New Roman', serif;
            color: #1a1a1a;
            margin: 0;
            padding: 40px 20px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .book-root {
            max-width: 900px;
            margin: 0 auto;
        }
        .page {
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 6px 24px rgba(0,0,0,0.08);
            padding: 60px 50px;
            margin-bottom: 40px;
            position: relative;
        }
        .title-page {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            text-align: center;
            margin-top: 40px;
        }
        h1 {
            font-size: 3.5rem;
            margin-bottom: 0.5rem;
            color: #2c2c2c;
            line-height: 1.1;
        }
        .subtitle {
            font-size: 1.4rem;
            color: #666;
            font-style: italic;
            margin-top: 0;
        }
        .chapter h2 {
            font-size: 2.2rem;
            margin-top: 0;
            margin-bottom: 1.5rem;
            color: #444;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 0.5rem;
        }
        .story-text {
            font-size: 1.25rem;
            line-height: 1.7;
            white-space: pre-wrap;
            margin-bottom: 3rem;
        }
        .illustration-prompt {
            margin-top: 24px;
            padding: 24px;
            border-radius: 12px;
            border: 2px dashed #e5e0d8;
            background-color: #faf7f2;
            font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
            font-size: 0.95rem;
            color: #555;
        }
        .prompt-label {
            display: block;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.1em;
            color: #888;
            margin-bottom: 0.5rem;
        }

        /* Print-specific overrides */
        @media print {
            body {
                background-color: white;
                padding: 0;
                margin: 0;
            }
            .book-root {
                max-width: 100%;
                width: 100%;
                margin: 0;
            }
            .page {
                box-shadow: none;
                border-radius: 0;
                margin: 0;
                padding: 0;
                border: none;
                width: 100%;
                margin-bottom: 0;
            }
            .title-page {
                min-height: 90vh;
                page-break-after: always;
                margin-top: 0;
            }
            .chapter {
                page-break-after: always;
                margin-top: 2cm;
            }
            .chapter:last-child {
                page-break-after: auto;
            }
            .illustration-prompt {
                border-color: #ccc;
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="book-root">
        <section class="title-page page">
            <h1>The Complete Story of ${childName}</h1>
            <p class="subtitle">Generated with StorySmith</p>
        </section>
`;

      scenes.forEach(scene => {
        htmlContent += `
        <section class="page chapter">
            <h2>Chapter ${scene.index}: ${scene.title}</h2>
            <p class="story-text">${scene.text}</p>
            <div class="illustration-prompt">
                <span class="prompt-label">Illustration Prompt</span>
                ${scene.illustrationPrompt}
            </div>
        </section>`;
      });

      htmlContent += `
    </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const safeId = state.storyId || `story-${Date.now()}`;
      link.href = url;
      link.download = `storysmith-${safeId}.html`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate HTML storybook:", e);
    }
  };
  
  // Theme styling for the main wrapper (screen-only)
  // Day: Warm, paper-like background. Night: Deep, cozy slate.
  const themeWrapperClasses = theme === 'night' 
    ? 'bg-slate-950 text-slate-300' 
    : 'bg-[#f5f1e9] text-stone-800';

  // If we are mid-redirect or data is still loading/missing, return a minimal view.
  if (!hero.childName || scenes.length === 0) {
    return (
      <Layout title="Story Missing">
        <div className="p-10 text-center">
          <p className="text-xl text-stone-600">
            Loading story, or the story hasn't been fully generated yet. Redirecting you to the builder...
          </p>
        </div>
      </Layout>
    );
  }
  
  const childName = hero.childName || "Your Hero";

  return (
    <Layout title={`Read ${childName}'s Adventure`}>
      <div className={`min-h-screen transition-colors duration-500 flex flex-col items-center ${themeWrapperClasses}`}>
        
        {/* --- 1. SCREEN-ONLY READER VIEW --- */}
        <div className="screen-only w-full max-w-6xl px-4 py-6 md:py-10 flex flex-col items-center">
            
            {/* HEADER: Now Reading Bar */}
            <header className="w-full flex justify-between items-center mb-8 max-w-3xl mx-auto">
                {/* Theme Toggle (Left) */}
                <div className={`flex items-center p-1 rounded-full border ${
                  theme === 'night' ? 'bg-slate-900 border-slate-700' : 'bg-white border-stone-200 shadow-sm'
                }`}>
                    <button 
                        onClick={() => setTheme('day')} 
                        className={`p-2 rounded-full transition-all ${
                          theme === 'day' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-stone-400 hover:text-stone-600'
                        }`}
                        aria-label="Toggle Day Theme"
                        title="Day Mode"
                    >
                        <Sun className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={() => setTheme('night')} 
                        className={`p-2 rounded-full transition-all ${
                          theme === 'night' ? 'bg-indigo-900 text-indigo-300 shadow-sm' : 'text-stone-400 hover:text-stone-600'
                        }`}
                        aria-label="Toggle Night Theme"
                        title="Night Mode"
                    >
                        <Moon className="h-4 w-4" />
                    </button>
                </div>
                
                {/* Center Title Block */}
                <div className="text-center px-4">
                    <h1 className="text-lg md:text-xl font-bold font-serif tracking-tight mb-1">
                        Now reading: {childName}’s Adventure
                    </h1>
                    <p className={`text-xs md:text-sm font-medium ${theme === 'night' ? 'text-slate-500' : 'text-stone-500'}`}>
                        Tap the circles below to jump chapters, or use arrows to turn pages.
                    </p>
                </div>
                
                {/* Visual Spacer (Right) - Matches toggle width approx ~80px */}
                <div className="flex items-center justify-end gap-2 w-[200px]">
  <button
    type="button"
    onClick={() => setReviewMode(v => !v)}
    className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
      reviewMode
        ? (theme === 'night' ? 'bg-indigo-900 text-indigo-200 border-indigo-800' : 'bg-orange-100 text-orange-800 border-orange-200')
        : (theme === 'night' ? 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50')
    }`}
    title="Toggle review mode (show all pages)"
  >
    {reviewMode ? 'Review: ON' : 'Review'}
  </button>

  <button
    type="button"
    onClick={() => setInspectorOpen(v => !v)}
    className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
      inspectorOpen
        ? (theme === 'night' ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-stone-100 text-stone-800 border-stone-200')
        : (theme === 'night' ? 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50')
    }`}
    title="Toggle inspector"
  >
    {inspectorOpen ? 'Inspector: ON' : 'Inspector'}
  </button>
</div> 
            </header>

            {/* NAV PILLS (Scene selectors) */}
            <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-2xl">
                {scenes.map((scene) => (
                    <button
                        key={scene.id}
                        onClick={() => setActiveSceneId(scene.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
                            ${scene.id === activeSceneId 
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30 scale-110' 
                                : (theme === 'night'
                                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                                    : 'bg-white text-stone-400 hover:bg-white hover:shadow-md hover:text-orange-500 border border-stone-100')
                            }`}
                        title={`Go to Chapter ${scene.index}`}
                    >
                        {scene.index}
                    </button>
                ))}
            </div>

            {/* MAIN READER CARD */}
            {reviewMode ? (
  <main className="w-full max-w-3xl mb-10 relative z-10">
    <div className="space-y-10">
      {scenes.map((scene) => (
        <div key={scene.id}>
          <StoryPageView scene={scene} isScreenView={true} theme={theme} />
          <div className="mt-3 flex items-center justify-end">
            <button
              type="button"
              className="text-xs font-semibold px-3 py-2 rounded-full border transition-all"
              onClick={() => copyToClipboard(scene.illustrationPrompt || "", "Chapter prompt")}
              title="Copy illustration prompt"
            >
              Copy prompt
            </button>
          </div>
        </div>
      ))}
    </div>
  </main>
) : (
<main className="w-full max-w-3xl mb-10 relative z-10">
                {activeScene && (
                    <StoryPageView 
                        scene={activeScene} 
                        isScreenView={true} 
                        theme={theme} 
                    />
                )}
            </main>
)}
            
            {/* FOOTER ACTIONS - Compact Layout */}
            {inspectorOpen ? (
  <section className={`w-full max-w-4xl mb-10 rounded-2xl border p-5 md:p-6 transition-all ${
    theme === "night" ? "bg-slate-900/60 border-slate-800" : "bg-white/70 border-stone-200 shadow-sm"
  }`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className={`text-sm font-bold uppercase tracking-wider ${
          theme === "night" ? "text-slate-300" : "text-stone-700"
        }`}>
          Inspector - Story Inputs
        </h2>
        <p className={`mt-1 text-xs ${
          theme === "night" ? "text-slate-500" : "text-stone-500"
        }`}>
          Quick visibility to evaluate writing + illustration prompts.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(JSON.stringify(buildSessionFromStoryState(state), null, 2), "Session JSON")}
        >
          <Copy className="h-4 w-4 mr-2" /> Copy Session JSON
        </Button>
      </div>
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <div className={`rounded-xl border p-4 ${theme === "night" ? "border-slate-800 bg-slate-950/40" : "border-stone-200 bg-stone-50/60"}`}>
        <div className={`text-xs font-semibold uppercase tracking-wider ${theme === "night" ? "text-slate-400" : "text-stone-500"}`}>
          Key constraints
        </div>
        <div className={`mt-3 text-sm space-y-1 ${theme === "night" ? "text-slate-300" : "text-stone-800"}`}>
          <div><span className="opacity-70">Hero:</span> {hero.childName || "—"}</div>
          <div><span className="opacity-70">Reader:</span> {hero.readerName || "—"}</div>
          <div><span className="opacity-70">Chapters:</span> {scenes.length}</div>
        </div>
      </div>

      <div className={`rounded-xl border p-4 ${theme === "night" ? "border-slate-800 bg-slate-950/40" : "border-stone-200 bg-stone-50/60"}`}>
        <div className={`text-xs font-semibold uppercase tracking-wider ${theme === "night" ? "text-slate-400" : "text-stone-500"}`}>
          Session JSON (preview)
        </div>
        <pre className={`mt-3 text-[11px] leading-relaxed overflow-auto max-h-[260px] rounded-lg p-3 border ${
          theme === "night" ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-stone-200 text-stone-700"
        }`}>
{JSON.stringify(buildSessionFromStoryState(state), null, 2)}
        </pre>
      </div>
    </div>

    {toast ? (
      <div className={`mt-4 text-xs font-semibold ${theme === "night" ? "text-slate-400" : "text-stone-600"}`}>
        {toast}
      </div>
    ) : null}
  </section>
) : null}


<footer className="w-full max-w-4xl flex flex-col gap-8 items-center pb-12">
                
                {/* 1. Primary Navigation (Prev/Next) */}
                <div className="flex items-center gap-4 w-full max-w-md">
                    <Button 
                        onClick={handlePrev}
                        disabled={isFirstPage}
                        variant="secondary"
                        className="flex-1"
                        size="sm"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Button 
                        onClick={handleNext}
                        disabled={isLastPage}
                        variant="primary"
                        className="flex-1 shadow-md shadow-orange-500/20"
                        size="sm"
                    >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
                
                <div className={`w-full h-px ${theme === 'night' ? 'bg-slate-800' : 'bg-stone-200'} max-w-2xl`}></div>

                {/* 2. Secondary Tools Grid - Responsive Wrap */}
                <div className="flex flex-wrap justify-center gap-3 w-full max-w-3xl">
                    <Button variant="outline" size="sm" onClick={() => router.push('/build')} className="min-w-[140px]">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Edit Story
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={() => router.push('/start')} className="min-w-[140px]">
                        <RefreshCw className="h-4 w-4 mr-2" /> New Story
                    </Button>

                    <Button variant="outline" size="sm" onClick={handleDownloadJson} className="min-w-[140px]">
                        <Download className="h-4 w-4 mr-2" /> Save JSON
                    </Button>
                    
                    <Button variant="secondary" size="sm" onClick={handleDownloadHtml} className="min-w-[140px]">
                        <BookOpen className="h-4 w-4 mr-2" /> Save HTML
                    </Button>
                </div>

                {/* 3. Main Export Call To Action */}
                <div className="w-full max-w-sm mt-2">
                    <Button 
                        variant="primary" 
                        size="lg" 
                        onClick={handlePrint}
                        className="w-full shadow-lg"
                    >
                        <Printer className="mr-2 h-5 w-5" /> Print or Save as PDF
                    </Button>
                </div>
            </footer>
        </div>

        {/* --- 2. PRINT-ONLY FULL STORY (Preserved for PDF generation) --- */}
        <div className="print-only">
             {/* Print Header/Title Page */}
             <div className="text-center pt-8 pb-12 print-header print-page-break">
                <h1 className="text-4xl font-serif font-extrabold text-stone-900 mb-4">
                    The Complete Story of {childName}
                </h1>
                <p className="text-sm text-stone-600">Generated by StorySmith</p>
            </div>
            
            <div className="space-y-12 story-pages-container">
              {scenes.map((scene, index) => (
                <div 
                    key={scene.id}
                    // Apply page break after every scene except the last one
                    className={index < scenes.length - 1 ? "print-page-break" : ""}
                >
                    {/* Render with isScreenView=false to get print styling */}
                    <StoryPageView scene={scene} isScreenView={false} />
                </div>
              ))}
            </div>
        </div>
        
      </div>
    </Layout>
  );
};

export default PreviewPage;
