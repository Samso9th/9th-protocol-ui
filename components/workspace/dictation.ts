"use client";
import { useEffect, useRef, useState } from "react";
interface Recognition {
  start(): void;
  stop(): void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult:
    | ((event: {
        resultIndex: number;
        results: {
          length: number;
          [index: number]: { isFinal: boolean; 0: { transcript: string } };
        };
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
export function useDictation(
  onText: (text: string) => void,
  onError: (message: string) => void,
) {
  const ref = useRef<Recognition | null>(null);
  const [listening, setListening] = useState(false);
  useEffect(
    () => () => {
      if (ref.current) {
        ref.current.onresult = null;
        ref.current.onend = null;
        ref.current.onerror = null;
        ref.current.stop();
      }
    },
    [],
  );
  function toggle() {
    if (listening) {
      ref.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Constructor) {
      onError(
        "Voice input is not supported in this browser yet. You can use your device’s keyboard dictation.",
      );
      return;
    }
    const recognition = new Constructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language;
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++)
        if (event.results[i].isFinal) onText(event.results[i][0].transcript);
    };
    recognition.onerror = (event) => {
      setListening(false);
      onError(
        event.error === "not-allowed"
          ? "Microphone access was not granted. You can enable it in your browser settings."
          : "Voice input could not start. Please try again.",
      );
    };
    recognition.onend = () => setListening(false);
    ref.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      onError("Voice input could not start. Please try again.");
    }
  }
  return { listening, toggle };
}
