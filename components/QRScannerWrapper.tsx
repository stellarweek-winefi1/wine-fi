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
      onError={onError}
    />
  );
}

