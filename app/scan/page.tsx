"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, QrCode, Camera, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ScanPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const handleScan = (result: string) => {
    if (result && isScanning) {
      setScannedData(result);
      setIsScanning(false);
    }
  };

  const handleError = (error: unknown) => {
    console.error("QR Scanner Error:", error);
    if (error instanceof Error) {
      if (error.name === "NotAllowedError" || error.message.includes("Permission")) {
        setCameraError(t.scan.errors.permissionDenied);
        setIsScanning(false);
      } else if (error.name === "NotFoundError") {
        setCameraError(t.scan.errors.noCamera);
        setIsScanning(false);
      } else {
        setCameraError(t.scan.errors.cameraError);
        setIsScanning(false);
      }
    } else {
      setCameraError(t.scan.errors.cameraError);
      setIsScanning(false);
    }
  };

  const handleStartScan = async () => {
    try {
      setIsRequestingPermission(true);
      setCameraError(null);

      // Request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      // If we get here, permission was granted
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      setIsScanning(true);
      setIsRequestingPermission(false);
    } catch (error) {
      console.error("Camera access error:", error);
      setIsRequestingPermission(false);

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          setCameraError(t.scan.errors.permissionDenied);
        } else if (error.name === "NotFoundError") {
          setCameraError(t.scan.errors.noCamera);
        } else {
          setCameraError(t.scan.errors.accessError);
        }
      } else {
        setCameraError(t.scan.errors.accessError);
      }
    }
  };

  const handleViewLot = () => {
    router.push(`/trazabilidad/demo`);
  };

  const handleScanAgain = () => {
    setScannedData(null);
    setIsScanning(false);
    setCameraError(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-black hover:text-gray-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t.scan.backButton}</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <QrCode className="w-8 h-8 text-black" />
              <h1 className="text-3xl font-bold text-black">{t.scan.title}</h1>
            </div>
            <p className="text-gray-600">
              {t.scan.subtitle}
            </p>
          </div>

          {isScanning ? (
            <div className="bg-white rounded-2xl border-2 border-black shadow-xl overflow-hidden">
              <div className="aspect-square max-w-md mx-auto bg-black relative overflow-hidden">
                <Scanner
                  onScan={(detectedCodes) => {
                    if (detectedCodes && detectedCodes.length > 0) {
                      handleScan(detectedCodes[0].rawValue);
                    }
                  }}
                  onError={handleError}
                />
                {/* Overlay with scanning frame */}
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="absolute inset-0 bg-black bg-opacity-30">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white border-dashed rounded-lg"></div>
                  </div>
                </div>
                <p className="absolute bottom-4 left-0 right-0 text-white text-center text-sm px-4 z-20 font-semibold">
                  {t.scan.positionQR}
                </p>
              </div>
              <div className="p-6 text-center border-t border-black bg-gray-50">
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
                  {t.scan.cancelScan}
                </button>
              </div>
            </div>
          ) : !scannedData ? (
            <div className="bg-white rounded-2xl border-2 border-black shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="bg-black w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-2xl flex items-center justify-center mb-6">
                  <QrCode className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">
                  {t.scan.scanTitle}
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {t.scan.scanSubtitle}
                </p>
              </div>

              {cameraError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{cameraError}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleStartScan}
                disabled={isRequestingPermission}
                className="w-full bg-black text-white px-6 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isRequestingPermission ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.scan.requestingPermissions}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    {t.scan.activateCamera}
                  </>
                )}
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border-2 border-black shadow-xl p-8"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="bg-green-100 rounded-full p-4">
                  <Check className="w-12 h-12 text-green-600" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-black text-center mb-4">
                {t.scan.successTitle}
              </h2>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">{t.scan.scannedCode}</p>
                <p className="text-lg font-mono text-black break-all">
                  {scannedData}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleViewLot}
                  className="flex-1 bg-black text-white px-6 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
                >
                  {t.scan.viewLotInfo}
                </button>
                <button
                  onClick={handleScanAgain}
                  className="flex-1 bg-white text-black px-6 py-4 rounded-lg font-semibold border-2 border-black hover:bg-gray-50 transition-colors"
                >
                  {t.scan.scanAnother}
                </button>
              </div>
            </motion.div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              {t.scan.cameraInfo}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
