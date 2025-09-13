// src/App.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Saathi Voice Assistant — localized UI
 * - Small i18n map drives UI copy (greeting, loader, button text)
 * - User transcript shown verbatim
 * - Backend audio/text handled as before
 */

const SUPPORTED_LANGS = [
  { code: "en-US", label: "English", prefix: "en" },
  { code: "hi-IN", label: "हिन्दी", prefix: "hi" },
  { code: "bn-IN", label: "বাংলা", prefix: "bn" },
  { code: "ta-IN", label: "தமிழ்", prefix: "ta" },
  { code: "te-IN", label: "తెలుగు", prefix: "te" },
  { code: "kn-IN", label: "ಕನ್ನಡ", prefix: "kn" },
];

// Minimal UI translations keyed by language prefix
const UI_STRINGS = {
  en: {
    greeting: "👋 Welcome to Saathi Voice Assistant",
    loading: "Saathi is thinking...",
    langSet: "Language set. You can speak now.",
    tapToSpeak: "Tap to Speak",
    listening: "Listening...",
    errorPlayback: "Sorry — something went wrong. Please try again.",
  },
hi: {
  greeting: "👋 साथी वॉइस असिस्टेंट में आपका स्वागत है",
  loading: "साथी सोच रहा है...",
  langSet: "भाषा सेट हो गई। अब आप बोल सकते हैं।",
  tapToSpeak: "बोलिए (टैप करें)",
  listening: "सुन रहा हूँ...",
  errorPlayback: "माफ कीजिए — कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
},
  bn: {
    greeting: "👋 Saathi Voice Assistant-এ আপনাকে স্বাগতম",
    loading: "Saathi ভাবছে...",
    langSet: "ভাষা সেভ হয়েছে। এখন কথা বলুন।",
    tapToSpeak: "বলো (ট্যাপ করুন)",
    listening: "শুনছি...",
    errorPlayback: "দুঃখিত — কিছু ভুল হয়েছে। আবার চেষ্টা করুন।",
  },
  ta: {
    greeting: "👋 Saathi Voice Assistant-இல் உங்கள் வரவேற்பு",
    loading: "Saathi சிந்திக்கிறான்...",
    langSet: "மொழி தேர்ந்தெடுக்கப்பட்டது. பேச தொடங்கலாம்.",
    tapToSpeak: "பேசவும் (தட்டவும்)",
    listening: "கேட்கிறேன்...",
    errorPlayback: "மன்னிக்கவும் — பிழை ஏற்பட்டது. மீண்டும் முயற்சி செய்.",
  },
  te: {
    greeting: "👋 Saathi Voice Assistant కు స్వాగతం",
    loading: "Saathi ఆలోచిస్తున్నాడు...",
    langSet: "భాష సెటైంది. ఇప్పుడు మాట్లాడు.",
    tapToSpeak: "మాట్లాడు (టాప్ చేయండి)",
    listening: "విప్పిచూస్తున్నాను...",
    errorPlayback: "క్షమించండి — లోపం జరిగింది. మళ్లీ ప్రయత్నించండి.",
  },
  kn: {
    greeting: "👋 Saathi Voice Assistantಗೆ ಸ್ವಾಗತ",
    loading: "Saathi ಯೋಚಿಸುತ್ತಿದೆ...",
    langSet: "ಭಾಷೆ ಸೆಟ್ ಆಯಿತು. şimdi ಮಾತಾಡಬಹುದು.",
    tapToSpeak: "ಮಾತನಾಡಿ (ಟ್ಯಾಪ್ ಮಾಡಿ)",
    listening: "ಕಿವಿ ಇಟ್ಟಿದ್ದೇನೆ...",
    errorPlayback: "ಕ್ಷಮಿಸಿ — ಏನೋ ತಪ್ಪಾಗಿದೆ. ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.",
  },
};

// pick UI strings by selected lang code (fallback to English)
function uiFor(langCode) {
  const prefix = (langCode || "en-US").split("-")[0];
  return UI_STRINGS[prefix] || UI_STRINGS.en;
}

export default function App() {
  const initialLang = localStorage.getItem("saathiLang") || "en-US";
  const [language, setLanguage] = useState(initialLang);
  let ui = uiFor(language);

  const [messages, setMessages] = useState(() => [
    { id: Date.now(), type: "ai", text: ui.greeting, ts: Date.now(), lang: language },
  ]);
  const [listening, setListening] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(() => !localStorage.getItem("saathiLang"));

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const voicesRef = useRef([]);

  const supportedLanguages = SUPPORTED_LANGS;

  // load voices for fallback TTS
  useEffect(() => {
    const loadVoices = () => (voicesRef.current = window.speechSynthesis.getVoices() || []);
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      try {
        window.speechSynthesis.onvoiceschanged = null;
      } catch {}
    };
  }, []);

  // init recognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = language;

    rec.onresult = async (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;

      // show user message verbatim (no translation)
      const userMsg = { id: Date.now() + Math.random(), type: "user", text: transcript, ts: Date.now(), lang: language };
      setMessages((prev) => [...prev, userMsg]);

      // show loading in selected language
      const loadingId = Date.now() + Math.random();
      const loadingMsg = { id: loadingId, type: "loading", text: uiFor(language).loading, ts: Date.now(), lang: language };
      setMessages((prev) => [...prev, loadingMsg]);

      try {
        // call backend (adjust endpoint/shape as needed)
        const res = await fetch("http://127.0.0.1:8000/saathi/tts/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcript, lang: language }),
        });

        if (!res.ok) throw new Error(`server ${res.status}`);

        const contentType = (res.headers.get("content-type") || "").toLowerCase();

        let audioUrl = null;
        let replyText = null;
        let createdObjectUrl = false;

        if (contentType.includes("application/json")) {
          const j = await res.json();
          audioUrl = j.url || null;
          replyText = j.text || null;
        } else if (contentType.includes("audio/") || contentType.includes("application/octet-stream")) {
          const blob = await res.blob();
          audioUrl = URL.createObjectURL(blob);
          createdObjectUrl = true;
        } else {
          try {
            const j = await res.json();
            audioUrl = j.url || null;
            replyText = j.text || null;
          } catch {
            throw new Error("unsupported response");
          }
        }

        // if server returned text but no audio, speak it using browser TTS in selected language
        if (!audioUrl && replyText) {
          speak(replyText, language);
        } else if (audioUrl) {
          await playAudioUrl(audioUrl);
        } else {
          throw new Error("no audio/text");
        }

        // replace loader with AI reply text (use server text if provided; assume it's localized)
        const finalText = replyText || uiFor(language).greeting; // fallback localized generic
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId ? { id: Date.now() + Math.random(), type: "ai", text: finalText, ts: Date.now(), lang: language } : m
          )
        );

        if (createdObjectUrl) {
          setTimeout(() => {
            try {
              URL.revokeObjectURL(audioUrl);
            } catch {}
          }, 30_000);
        }
      } catch (err) {
        console.error("TTS error", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId ? { id: Date.now() + Math.random(), type: "ai", text: uiFor(language).errorPlayback, ts: Date.now(), lang: language } : m
          )
        );
      }
    };

    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      console.warn("rec error", e);
      setListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.onresult = null;
        rec.onend = null;
        rec.onerror = null;
        if (typeof rec.abort === "function") rec.abort();
      } catch {}
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // keep recognition.lang in sync and persist language
  useEffect(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language;
      } catch {}
      // restart if currently listening so lang takes effect immediately
      if (listening) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch {}
          }, 200);
        } catch {}
      }
    }
    localStorage.setItem("saathiLang", language);
    // optionally update AI message badges
    setMessages((prev) => prev.map((m) => (m.type === "ai" ? { ...m, lang: language } : m)));
  }, [language]); // eslint-disable-line

  // scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // start/stop
  const startListening = () => {
    if (!recognitionRef.current) return alert("SpeechRecognition not supported");
    try {
      recognitionRef.current.lang = language;
    } catch {}
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      console.warn("start err", e);
      setListening(false);
    }
  };
  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
      setListening(false);
    } catch {}
  };

  // TTS fallback voice choice
  const chooseVoice = (bcp) => {
    const prefix = (bcp || "en").split("-")[0].toLowerCase();
    const v = voicesRef.current.find((vv) => vv.lang && vv.lang.toLowerCase().startsWith(prefix));
    if (v) return v;
    return voicesRef.current.find((vv) => vv.lang && vv.lang.toLowerCase().startsWith("en")) || null;
  };

  // browser TTS fallback
  const speak = (text, bcp = "en-US") => {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    const langToUse = bcp || language || navigator.language || "en-US";
    utter.lang = langToUse;
    const v = chooseVoice(langToUse);
    if (v) utter.voice = v;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("tts", e);
    }
  };

  // play audio url with autoplay handling
  function playAudioUrl(url) {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(url);
        audio.autoplay = true;
        audio.onended = () => resolve();
        audio.onerror = (e) => reject(e);
        const p = audio.play();
        if (p && typeof p.then === "function") {
          p.catch((err) => {
            console.warn("Autoplay blocked", err);
            // still resolve to avoid UI lock; user may need to tap to hear audio
            resolve();
          });
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  // select language
  const selectLanguage = (lang) => {
    setLanguage(lang);
    setShowLangPicker(false);
    const msgText = uiFor(lang).langSet;
    const msg = { id: Date.now() + Math.random(), type: "ai", text: msgText, ts: Date.now(), lang };
    setMessages((prev) => [...prev, msg]);
    speak(msgText, lang);
  };

  const timeFor = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // localized UI strings for controls
   ui = uiFor(language);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow p-3 flex items-center gap-3">
          <div className="text-2xl">🚕</div>
          <div>
            <div className="text-lg font-semibold">Porter Saathi Voice Assistant</div>
            <div className="text-sm opacity-90">{ui.greeting}</div>
          </div>
          <div className="ml-auto text-xs px-3 py-1 bg-white/10 rounded">{language}</div>
        </header>

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
                    {m.type === "loading" ? (
                      <div className="px-4 py-2 rounded-2xl bg-gray-100 flex items-center gap-3">
                        <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" fill="none" />
                        </svg>
                        <div className="text-slate-700">{m.text}</div>
                      </div>
                    ) : (
                      <div className={`px-4 py-2 rounded-2xl ${isUser ? "bg-cyan-600 text-black" : "bg-gray-100 text-slate-900"}`}>
                        {/* Display message verbatim — user transcript will be in their spoken language */}
                        {m.text}
                      </div>
                    )}
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

          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            {!showLangPicker ? (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-medium">Language:</span>
                <span className="px-2 py-1 bg-gray-50 rounded text-xs">{language}</span>
                <button onClick={() => setShowLangPicker(true)} className="ml-3 text-sm text-blue-600 underline">
                  Change
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Choose a language:</div>
            )}

            <button
              onClick={() => (listening ? stopListening() : startListening())}
              className={`px-4 py-2 rounded-full font-semibold shadow-md ${listening ? "bg-red-500 text-black" : "bg-cyan-600 text-black hover:scale-105"}`}
            >
              {listening ? ui.listening : ui.tapToSpeak}
            </button>
          </div>

          {showLangPicker && (
            <div className="p-4 border-t border-gray-50 bg-white/50 flex gap-2 flex-wrap">
              {supportedLanguages.map((lang) => (
                <button key={lang.code} onClick={() => selectLanguage(lang.code)} className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">
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
