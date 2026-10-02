"use client";
import { useEffect, useRef, useState } from "react";

/** In-browser QR scanner: native BarcodeDetector where available, jsQR fallback elsewhere (iOS Safari). */
export function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const handle = (text: string) => {
      try {
        const u = new URL(text, window.location.href);
        if (u.origin === window.location.origin && u.pathname.startsWith("/attendance/")) { stopped = true; setFound(u.pathname); window.location.assign(u.pathname); }
        else setError("That QR code isn't a Rotary Club of Gayaza attendance code.");
      } catch { setError("Couldn't read that code."); }
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        type BD = { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> };
        const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BD }).BarcodeDetector;
        const detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;
        const jsQR = detector ? null : (await import("jsqr")).default;
        const tick = async () => {
          if (stopped) return;
          if (v.readyState >= 2) {
            if (detector) {
              const codes = await detector.detect(v).catch(() => []);
              if (codes[0]) return handle(codes[0].rawValue);
            } else if (jsQR && ctx) {
              canvas.width = v.videoWidth; canvas.height = v.videoHeight;
              ctx.drawImage(v, 0, 0);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
              if (code?.data) return handle(code.data);
            }
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setError("Camera access was blocked. Use your phone's camera app to scan the code instead.");
      }
    })();
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-ink">
        <video ref={video} playsInline muted className="h-full w-full object-cover" aria-label="Camera preview" />
        <div aria-hidden className="pointer-events-none absolute inset-[18%] rounded-lg border-4 border-gold/80" />
      </div>
      {found && <p className="mt-4 font-semibold text-leaf" role="status">Code found — opening…</p>}
      {error && <p className="mt-4 font-semibold text-soil" role="alert">{error}</p>}
    </div>
  );
}
