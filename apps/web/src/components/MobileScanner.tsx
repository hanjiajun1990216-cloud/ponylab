"use client";

import { useState } from "react";
import { takePhoto, isNativePlatform } from "@/lib/capacitor";

interface MobileScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function MobileScanner({ onScan, onClose }: MobileScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const photo = await takePhoto();
      if (photo) {
        // In a real implementation, this would use a QR code decoder
        // For now, we pass the image data back
        onScan(photo);
      }
    } catch (err: any) {
      setError(err.message || "Failed to capture image");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Scan QR Code
        </h3>

        <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center mb-4">
          {scanning ? (
            <div className="text-gray-500 text-sm">Scanning...</div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm text-gray-500">
                {isNativePlatform()
                  ? "Tap to open camera"
                  : "Tap to select image"}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {scanning ? "Scanning..." : "Scan"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
