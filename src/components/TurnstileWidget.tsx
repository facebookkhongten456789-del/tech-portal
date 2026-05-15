"use client";

import { useEffect, useRef } from "react";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  siteKey: string;
}

export default function TurnstileWidget({ onVerify, siteKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey) return;

    // Load script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Initialize widget
    const checkTurnstile = setInterval(() => {
      if (window.hasOwnProperty("turnstile")) {
        (window as any).turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            onVerify(token);
          },
        });
        clearInterval(checkTurnstile);
      }
    }, 100);

    return () => {
      clearInterval(checkTurnstile);
      document.head.removeChild(script);
    };
  }, [siteKey, onVerify]);

  if (!siteKey) {
    return <div className="alert alert-error">Lỗi: Thiếu TURNSTILE_SITE_KEY trong .env</div>;
  }

  return <div ref={containerRef} className="cf-turnstile" style={{ margin: "16px 0" }}></div>;
}
