import React, { useState, useEffect } from "react";

export default function App() {
  const [messages, setMessages] = useState([
    { type: "ai", text: "Namaste! Main aapka Saathi voice assistant hoon. 🚕" },
  ]);
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem("saathiLang") || "");
  const [showLangPicker, setShowLangPicker] = useState(!language);

  let recognition;
  if ("webkitSpeechRecognition" in window) {
    recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    if (language) recognition.lang = language;
  }

  // Start listening
  const startListening = () => {
    if (!recognition) return alert("SpeechRecognition not supported in this browser.");
    setListening(true);
    recognition.start();
  };

  // Stop listening
  const stopListening = () => {
    if (!recognition) return;
    setListening(false);
    recognition.stop();
  };

  // Handle speech result
  if (recognition) {
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessages((prev) => [...prev, { type: "user", text: transcript }]);

      // Simulate AI response
      const responseText = `Aapne kaha: "${transcript}"`;
      setMessages((prev) => [...prev, { type: "ai", text: responseText }]);
      speak(responseText);
    };

    recognition.onend = () => setListening(false);
  }

  // Text-to-Speech
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language || "hi-IN"; // Use selected language
    window.speechSynthesis.speak(utterance);
  };

  // Handle language selection
  const selectLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("saathiLang", lang);
    setShowLangPicker(false);
    setMessages((prev) => [
      ...prev,
      { type: "ai", text: "Language set. Ab aap bol sakte hain." },
    ]);
    speak("Language set. Ab aap bol sakte hain.");
    if (recognition) recognition.lang = lang;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 text-center text-xl font-bold">
        Saathi Voice Assistant
      </div>

      {/* Chat / Feedback */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`my-2 p-2 rounded-lg max-w-xs ${
              msg.type === "user"
                ? "bg-blue-100 self-end text-right"
                : "bg-gray-200 self-start text-left"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Language Picker */}
      {showLangPicker && (
        <div className="p-4 flex flex-col gap-2 items-center">
          <p className="font-bold">Select your language / Apni bhasha chunein:</p>
          <div className="flex gap-2">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => selectLanguage("hi-IN")}
            >
              Hindi
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => selectLanguage("en-US")}
            >
              English
            </button>
            <button
              className="bg-purple-600 text-white px-4 py-2 rounded"
              onClick={() => selectLanguage("bn-IN")}
            >
              Bengali
            </button>
          </div>
        </div>
      )}

      {/* Voice Button */}
      {!showLangPicker && (
        <div className="p-4 flex justify-center">
          <button
            className={`px-6 py-3 rounded-full text-white font-bold ${
              listening ? "bg-red-600" : "bg-green-600"
            }`}
            onClick={listening ? stopListening : startListening}
          >
            {listening ? "Listening..." : "Tap to Speak"}
          </button>
        </div>
      )}
    </div>
  );
}
