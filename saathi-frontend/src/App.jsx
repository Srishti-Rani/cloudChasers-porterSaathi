import React, { useState, useEffect } from "react";

export default function App() {
  const [messages, setMessages] = useState([
    { type: "ai", text: "Namaste! Main aapka Saathi hoon. 🚕 Bolke shuru karein." },
  ]);
  const [listening, setListening] = useState(false);

  let recognition;
  if ("webkitSpeechRecognition" in window) {
    recognition = new window.webkitSpeechRecognition();
    recognition.lang = "hi-IN"; // Hindi
    recognition.continuous = false;
    recognition.interimResults = false;
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

    recognition.onend = () => {
      setListening(false);
    };
  }

  // Text-to-Speech
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN"; // Hindi voice
    window.speechSynthesis.speak(utterance);
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

      {/* Voice Button */}
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
    </div>
  );
}
