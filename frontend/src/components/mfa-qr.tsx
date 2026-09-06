"use client";

import { useEffect, useState } from "react";

export function MfaQr({ otpauthUrl }: { otpauthUrl: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let alive = true;
    void import("qrcode").then((qr) =>
      qr.toDataURL(otpauthUrl, { width: 180, margin: 1, color: { dark: "#111111", light: "#ffffff" } }).then((url) => {
        if (alive) setSrc(url);
      })
    );
    return () => {
      alive = false;
    };
  }, [otpauthUrl]);

  if (!src) {
    return <p className="text-sm text-muted">Preparing QR code…</p>;
  }

  return (
    <img
      src={src}
      alt="Scan this QR code in your authenticator app"
      width={180}
      height={180}
      className="rounded-xl bg-white p-2"
    />
  );
}
