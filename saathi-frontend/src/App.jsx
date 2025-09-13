// src/App.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Saathi Voice Assistant (Tailwind UI).
 * - Single SpeechRecognition instance created and cleaned up
 * - Language persisted in localStorage ("saathiLang")
 * - Uses SpeechSynthesis with best-matching voice for selected language
 * - Auto-scrolls conversation
 */

export default function App() {
  const [messages, setMessages] = useState(() => [
    { id: Date.now(), type: "ai", text: "Namaste! Main aapka Saathi voice assistant hoon. 🚕", ts: Date.now(), lang: "hi-IN" },
  ]);
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem("saathiLang") || "hi-IN");
  const [showLangPicker, setShowLangPicker] = useState(() => !localStorage.getItem("saathiLang"));
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const voicesRef = useRef([]);

  // load voices
  useEffect(() => {
    const load = () => (voicesRef.current = window.speechSynthesis.getVoices() || []);
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      try { window.speechSynthesis.onvoiceschanged = null; } catch {}
    };
  }, []);

  // initialize SpeechRecognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = language;

    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;

      const userMsg = { id: Date.now() + Math.random(), type: "user", text: transcript, ts: Date.now(), lang: language };
      setMessages((prev) => [...prev, userMsg]);

      // Here you'd call your backend / LLM. For demo we echo.
      const responseText = `Aapne kaha: "${transcript}"`;
      const aiMsg = { id: Date.now() + Math.random(), type: "ai", text: responseText, ts: Date.now(), lang: language };
      setMessages((prev) => [...prev, aiMsg]);
      speak(responseText, language);
    };

    rec.onend = () => {
      // only update if we expect recognition to stop
      setListening(false);
    };

    rec.onerror = (ev) => {
      console.warn("SpeechRecognition error", ev);
      setListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.onresult = null;
        rec.onend = null;
        rec.onerror = null;
        if (recognitionRef.current && typeof recognitionRef.current.abort === "function") {
          recognitionRef.current.abort();
        }
      } catch {}
      recognitionRef.current = null;
    };
    // only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update recognition.lang if user changes language
  useEffect(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language;
      } catch (e) {
        // ignore if browser disallows
      }
    }
  }, [language]);

  // auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const startListening = () => {
    if (!recognitionRef.current) return alert("SpeechRecognition not supported in this browser.");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      console.warn("recognition start error", e);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setListening(false);
    } catch (e) {
      console.warn("recognition stop error", e);
    }
  };

  // choose best voice for BCP47 (approx by prefix)
  const chooseVoice = (bcp) => {
    const prefix = (bcp || "en").split("-")[0].toLowerCase();
    const v = voicesRef.current.find((x) => x.lang && x.lang.toLowerCase().startsWith(prefix));
    if (v) return v;
    return voicesRef.current.find((x) => x.lang && x.lang.toLowerCase().startsWith("en")) || null;
  };

  const speak = (text, bcp = "hi-IN") => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = bcp;
    const v = chooseVoice(bcp);
    if (v) u.voice = v;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("TTS error", e);
    }
  };

  const selectLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("saathiLang", lang);
    setShowLangPicker(false);
    const msg = { id: Date.now(), type: "ai", text: "Language set. Ab aap bol sakte hain.", ts: Date.now(), lang };
    setMessages((prev) => [...prev, msg]);
    speak("Language set. Ab aap bol sakte hain.", lang);
  };

  // quick helper to format time
  const timeFor = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow p-3 flex items-center gap-3">
          <div className="text-2xl">🚕</div>
          <div>
            <div className="text-lg font-semibold">Saathi Voice Assistant</div>
            <div className="text-sm opacity-90">Bolke baat karein — Saathi aapki madad karega</div>
          </div>
          <div className="ml-auto text-xs px-3 py-1 bg-white/10 rounded">{language}</div>
        </header>

        {/* chat card */}
        <main className="mt-4 bg-white rounded-2xl shadow overflow-hidden">
          <div className="p-4 h-[60vh] overflow-y-auto space-y-4">
            {messages.map((m) => {
              const isUser = m.type === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"} items-end`}>
                  {!isUser && (
                    <div className="mr-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-800 text-white flex items-center justify-center">S</div>
                    </div>
                  )}

                  <div className="max-w-[78%]">
                    <div className={`${isUser ? "bg-cyan-600 text-white rounded-br-lg" : "bg-gray-100 text-slate-900 rounded-bl-lg"} px-4 py-3 rounded-2xl shadow-sm`}>
                      <div className="whitespace-pre-wrap break-words">{m.text}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>{timeFor(m.ts)}</span>
                      {!isUser && <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] rounded">{m.lang}</span>}
                    </div>
                  </div>

                  {isUser && (
                    <div className="ml-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500 text-white flex items-center justify-center">U</div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* footer controls */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-4">
            {!showLangPicker ? (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-medium">Language:</span>
                <span className="px-2 py-1 bg-gray-50 rounded text-xs">{language}</span>
                <button onClick={() => setShowLangPicker(true)} className="ml-3 text-sm text-blue-600 underline">Change</button>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Choose language below</div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => (listening ? stopListening() : startListening())}
                className={`flex items-center gap-3 px-4 py-2 rounded-full text-black font-semibold shadow-md ${listening ? "bg-red-500" : "bg-cyan-600 hover:scale-105"}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 1.75a2.75 2.75 0 00-2.75 2.75v6.5A2.75 2.75 0 0012 13.75a2.75 2.75 0 002.75-2.75v-6.5A2.75 2.75 0 0012 1.75z" fill="white" />
                  <path d="M19 10.25v.75A6 6 0 0112 17.75 6 6 0 015 11v-.75" stroke="black" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{listening ? "Listening..." : "Tap to Speak"}</span>
              </button>
            </div>
          </div>

          {/* language picker area */}
          {showLangPicker && (
            <div className="p-4 border-t border-gray-50 bg-white/50 flex gap-2 flex-wrap">
              <button onClick={() => selectLanguage("hi-IN")} className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Hindi</button>
              <button onClick={() => selectLanguage("en-US")} className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">English</button>
              <button onClick={() => selectLanguage("bn-IN")} className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Bengali</button>
              <button onClick={() => selectLanguage("ta-IN")} className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Tamil</button>
              <button onClick={() => selectLanguage("te-IN")} className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Telugu</button>
              <button onClick={() => selectLanguage("kn-IN")} className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Kannada</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
