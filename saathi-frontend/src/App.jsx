// src/App.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Saathi Voice Assistant
 * - Dynamic language support
 * - SpeechRecognition + SpeechSynthesis always use selected language
 * - Language persisted in localStorage
 * - UI language picker built from dynamic list
 */

export default function App() {
  const [messages, setMessages] = useState(() => [
    { id: Date.now(), type: "ai", text: "👋 Welcome to Saathi Voice Assistant", ts: Date.now(), lang: "en-US" },
  ]);
  const [listening, setListening] = useState(false);

  // language state (from storage or default "en-US")
  const [language, setLanguage] = useState(() => localStorage.getItem("saathiLang") || "en-US");
  const [showLangPicker, setShowLangPicker] = useState(() => !localStorage.getItem("saathiLang"));

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const voicesRef = useRef([]);

  // Supported languages (dynamic, no hard-coding in JSX)
  const supportedLanguages = [
    { code: "en-US", label: "English" },
    { code: "hi-IN", label: "Hindi" },
    { code: "bn-IN", label: "Bengali" },
    { code: "ta-IN", label: "Tamil" },
    { code: "te-IN", label: "Telugu" },
    { code: "kn-IN", label: "Kannada" },
  ];

  /** -------------------------
   *  Load Voices for TTS
   *  ------------------------ */
  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices() || [];
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      try { window.speechSynthesis.onvoiceschanged = null; } catch {}
    };
  }, []);

  /** -------------------------
   *  Init SpeechRecognition (once)
   *  ------------------------ */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported");
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = language; // set initial lang

    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;

      const userMsg = { id: Date.now(), type: "user", text: transcript, ts: Date.now(), lang: language };
      setMessages((prev) => [...prev, userMsg]);

      // Fake AI response
      const response = `"${transcript}"`;
      const aiMsg = { id: Date.now() + 1, type: "ai", text: response, ts: Date.now(), lang: language };
      setMessages((prev) => [...prev, aiMsg]);
      speak(response, language);
    };

    rec.onend = () => setListening(false);
    rec.onerror = (err) => {
      console.warn("SpeechRecognition error", err);
      setListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
        rec.onresult = null;
        rec.onend = null;
      } catch {}
      recognitionRef.current = null;
    };
    // run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** -------------------------
   *  Keep recognition in sync with language
   *  ------------------------ */
  useEffect(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language;
      } catch {}
    }
  }, [language]);

  /** -------------------------
   *  Auto-scroll messages
   *  ------------------------ */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** -------------------------
   *  Voice Utils
   *  ------------------------ */
  const chooseVoice = (bcp) => {
    const prefix = (bcp || "en").split("-")[0];
    const match = voicesRef.current.find((v) => v.lang?.toLowerCase().startsWith(prefix.toLowerCase()));
    return match || voicesRef.current.find((v) => v.lang?.toLowerCase().startsWith("en")) || null;
  };

  const speak = (text, bcp = "en-US") => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = bcp;
    const v = chooseVoice(bcp);
    if (v) u.voice = v;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  /** -------------------------
   *  Controls
   *  ------------------------ */
  const startListening = () => {
    if (!recognitionRef.current) return alert("SpeechRecognition not supported");
    try {
      recognitionRef.current.lang = language; // force set before start
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      console.warn("start error", e);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
      setListening(false);
    } catch {}
  };

  const selectLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("saathiLang", lang); // persist immediately
    setShowLangPicker(false);
    const msg = { id: Date.now(), type: "ai", text: `Language set to ${lang}`, ts: Date.now(), lang };
    setMessages((prev) => [...prev, msg]);
    speak(`Language set. You can start speaking now.`, lang);
  };

  const timeFor = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  /** -------------------------
   *  UI
   *  ------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow p-3 flex items-center gap-3">
          <div className="text-2xl">🚕</div>
          <div>
            <div className="text-lg font-semibold">Porter Saathi Voice Assistant</div>
            <div className="text-sm opacity-90">Speak and get help instantly</div>
          </div>
          <div className="ml-auto text-xs px-3 py-1 bg-white/10 rounded">{language}</div>
        </header>

        {/* Messages */}
        <main className="mt-4 bg-white rounded-2xl shadow overflow-hidden">
          <div className="p-4 h-[60vh] overflow-y-auto space-y-4">
            {messages.map((m) => {
              const isUser = m.type === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"} items-end`}>
                  {!isUser && (
                    <div className="mr-3">
                      <div className="w-8 h-8 rounded bg-gray-800 text-white flex items-center justify-center">S</div>
                    </div>
                  )}
                  <div className="max-w-[75%]">
                    <div className={`${isUser ? "bg-gray-100 text-slate-900 rounded-bl-lg" : "bg-gray-100 text-slate-900 rounded-bl-lg"} px-4 py-2 rounded-2xl`}>
                      {m.text}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{timeFor(m.ts)}</div>
                  </div>
                  {isUser && (
                    <div className="ml-3">
                      <div className="w-8 h-8 rounded bg-gray-800 text-white flex items-center justify-center">U</div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            {!showLangPicker ? (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-medium">Language:</span>
                <span className="px-2 py-1 bg-gray-50 rounded text-xs">{language}</span>
                <button onClick={() => setShowLangPicker(true)} className="ml-3 text-sm text-blue-600 underline">Change</button>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Choose a language:</div>
            )}

            <button
              onClick={() => (listening ? stopListening() : startListening())}
              className={`px-4 py-2 rounded-full font-semibold shadow-md ${listening ? "bg-red-500 text-black" : "bg-cyan-600 text-black hover:scale-105"}`}
            >
              {listening ? "Listening..." : "Tap to Speak"}
            </button>
          </div>

          {/* Language Picker */}
          {showLangPicker && (
            <div className="p-4 border-t border-gray-50 bg-white/50 flex gap-2 flex-wrap">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => selectLanguage(lang.code)}
                  className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
