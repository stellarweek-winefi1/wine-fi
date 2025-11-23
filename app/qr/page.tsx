"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, QrCode, Camera, AlertCircle } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";

// Dynamically import QRScannerWrapper to avoid SSR issues
const QRScannerWrapper = dynamic(
  () => import("@/components/QRScannerWrapper"),
  {
    ssr: false,
    loading: () => {
      // This will be replaced with translated text in the component
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white">Loading camera...</div>
        </div>
      );
    },
  }
);

export default function QRPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleScan = (result: string) => {
    if (result && isScanning && !scannedData) {
      setScannedData(result);
      setIsScanning(false);
    }
  };

  const handleError = (error: unknown) => {
    console.error("QR Scanner Error:", error);
    if (error instanceof Error) {
      if (error.name === "NotAllowedError" || error.message.includes("Permission")) {
        setCameraError(t.qrScanner.errors.permissionDenied);
      } else if (error.name === "NotFoundError") {
        setCameraError(t.qrScanner.errors.noCamera);
      } else {
        setCameraError(t.qrScanner.errors.cameraError);
      }
    } else {
      setCameraError(t.qrScanner.errors.cameraError);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setScannedData(manualCode.trim());
    }
  };

  const handleViewLot = () => {
    if (scannedData) {
      // Try to extract lot ID from URL or use the scanned data directly
      let lotId = scannedData;
      
      // If it's a URL, extract the ID from the path
      if (scannedData.includes("/trazabilidad/")) {
        const match = scannedData.match(/\/trazabilidad\/([^/?]+)/);
        if (match) {
          lotId = match[1];
        }
      } else if (scannedData.includes("/lote/")) {
        const match = scannedData.match(/\/lote\/([^/?]+)/);
        if (match) {
          lotId = match[1];
        }
      }
      
      router.push(`/trazabilidad/${lotId}`);
    }
  };

  const handleScanAgain = () => {
    setScannedData(null);
    setManualCode("");
    setIsScanning(false);
    setCameraError(null);
  };

  const handleStartScan = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      // If we get here, permission was granted
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      setIsScanning(true);
      setCameraError(null);
    } catch (error) {
      console.error("Camera access error:", error);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          setCameraError(t.qrScanner.errors.permissionDenied);
        } else if (error.name === "NotFoundError") {
          setCameraError(t.qrScanner.errors.noCamera);
        } else {
          setCameraError(t.qrScanner.errors.accessError);
        }
      } else {
        setCameraError(t.qrScanner.errors.accessError);
      }
    }
  };

  // Auto-start scanning when component mounts (optional)
  useEffect(() => {
    // Uncomment to auto-start on mount
    // handleStartScan();
  }, []);

  return (
    <main className="min-h-screen bg-white py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-black hover:text-gray-800 mb-4 sm:mb-6 md:mb-8 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          <span className="font-medium">{t.qrScanner.backButton}</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <QrCode className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
                {t.qrScanner.title}
              </h1>
            </div>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              {t.qrScanner.subtitle}
            </p>
          </div>

          {!scannedData ? (
            <div className="space-y-6">
              {/* Scanner Area */}
              {isScanning ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-2xl border-2 border-black shadow-xl overflow-hidden"
                >
                  <div className="aspect-square max-w-md mx-auto bg-black relative overflow-hidden">
                    <QRScannerWrapper
                      onScan={handleScan}
                      onError={handleError}
                    />
                    {/* Overlay with scanning frame */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <div className="absolute inset-0 bg-black bg-opacity-30">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white border-dashed rounded-lg"></div>
                      </div>
                    </div>
                    <p className="absolute bottom-4 left-0 right-0 text-white text-center text-sm px-4 z-20 font-semibold">
                      {t.qrScanner.positionQR}
                    </p>
                  </div>
                  <div className="p-4 sm:p-6 text-center border-t-2 border-black bg-gray-50">
                    {cameraError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{cameraError}</span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setIsScanning(false);
                        setCameraError(null);
                      }}
                      className="px-4 py-2 bg-white text-black border-2 border-black rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      {t.qrScanner.cancelScan}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-2xl border-2 border-black shadow-xl p-6 sm:p-8"
                >
                  <div className="text-center mb-6">
                    <div className="bg-black w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-2xl flex items-center justify-center mb-6">
                      <QrCode className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">
                      {t.qrScanner.scanTitle}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">
                      {t.qrScanner.scanSubtitle}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={handleStartScan}
                      className="w-full bg-black text-white px-6 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      {t.qrScanner.activateCamera}
                    </button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">{t.qrScanner.or}</span>
                      </div>
                    </div>

                    <form onSubmit={handleManualSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="manual-code"
                          className="block text-sm font-medium text-black mb-2"
                        >
                          {t.qrScanner.manualEntry}
                        </label>
                        <input
                          id="manual-code"
                          type="text"
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value)}
                          placeholder={t.qrScanner.placeholder}
                          className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm sm:text-base"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!manualCode.trim()}
                        className="w-full bg-white text-black px-6 py-3 rounded-lg font-semibold border-2 border-black hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {t.qrScanner.verifyCode}
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border-2 border-black shadow-xl p-6 sm:p-8"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="bg-green-100 rounded-full p-4">
                  <Check className="w-12 h-12 sm:w-16 sm:h-16 text-green-600" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-black text-center mb-4">
                {t.qrScanner.codeVerified}
              </h2>

              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">{t.qrScanner.lotCode}</p>
                <p className="text-base sm:text-lg font-mono text-black break-all font-semibold">
                  {scannedData}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleViewLot}
                  className="flex-1 bg-black text-white px-6 py-3 sm:py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg text-sm sm:text-base"
                >
                  {t.qrScanner.viewTraceability}
                </button>
                <button
                  onClick={handleScanAgain}
                  className="flex-1 bg-white text-black px-6 py-3 sm:py-4 rounded-lg font-semibold border-2 border-black hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  {t.qrScanner.scanAnother}
                </button>
              </div>
            </motion.div>
          )}

          {/* Info Section */}
          <div className="mt-8 text-center">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
              <p className="text-sm sm:text-base text-gray-600 mb-2">
                <strong>{t.qrScanner.whatCanVerify}</strong>
              </p>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1 text-left max-w-md mx-auto">
                <li>• {t.qrScanner.verifyItems.authenticity}</li>
                <li>• {t.qrScanner.verifyItems.timeline}</li>
                <li>• {t.qrScanner.verifyItems.blockchain}</li>
                <li>• {t.qrScanner.verifyItems.documentation}</li>
                <li>• {t.qrScanner.verifyItems.publicInfo}</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

