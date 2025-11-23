"use client";

import { Scanner } from "@yudiel/react-qr-scanner";

interface QRScannerWrapperProps {
  onScan: (result: string) => void;
  onError: (error: unknown) => void;
}

export default function QRScannerWrapper({ onScan, onError }: QRScannerWrapperProps) {
  return (
    <Scanner
      onScan={(detectedCodes) => {
        if (detectedCodes && detectedCodes.length > 0) {
          onScan(detectedCodes[0].rawValue);
        }
      }}
      onError={(error) => {
        // Enhanced error handling for camera permission errors
        if (error instanceof Error) {
          if (error.name === "NotAllowedError" || error.message.includes("Permission")) {
            onError(new Error("Permisos de cámara denegados. Por favor, permite el acceso a la cámara."));
          } else if (error.name === "NotFoundError") {
            onError(new Error("No se encontró ninguna cámara en tu dispositivo."));
          } else {
            onError(error);
          }
        } else {
          onError(error);
        }
      }}
    />
  );
}



