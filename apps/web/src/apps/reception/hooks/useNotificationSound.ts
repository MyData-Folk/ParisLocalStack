import { useEffect, useRef } from "react";

export function useNotificationSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const playPing = () => {
    // Ne joue le son que si l'onglet n'est PAS en focus (document.hidden)
    if (!document.hidden) return;

    try {
      initAudioContext();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Premier ping : 880Hz pendant 30ms
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 880;
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc1.start(now);
      osc1.stop(now + 0.03);

      // Silence de 50ms -> le deuxième ping démarre à now + 30ms + 50ms = now + 80ms
      const start2 = now + 0.08;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 660;
      gain2.gain.setValueAtTime(0.15, start2);
      gain2.gain.exponentialRampToValueAtTime(0.001, start2 + 0.03);
      osc2.start(start2);
      osc2.stop(start2 + 0.03);
    } catch (err) {
      console.warn("Web Audio API error:", err);
    }
  };

  return { playPing };
}
