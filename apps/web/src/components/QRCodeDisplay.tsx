"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 128 }: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!value) return;
    setDataUrl(null);
    setError(false);
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#1e293b", light: "#ffffff" },
    })
      .then((url) => setDataUrl(url))
      .catch(() => setError(true));
  }, [value, size]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400"
        style={{ width: size, height: size }}
      >
        QR Error
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className="animate-pulse rounded-lg bg-gray-100"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR code for ${value}`}
      width={size}
      height={size}
      className="rounded-lg border border-gray-200"
    />
  );
}
