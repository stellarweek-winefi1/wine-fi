"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, QrCode } from "lucide-react";
import Link from "next/link";

export default function ScanPage() {
  const router = useRouter();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = (result: string) => {
    if (result && isScanning) {
      setScannedData(result);
      setIsScanning(false);
    }
  };

  const handleError = (error: unknown) => {
    console.error("QR Scanner Error:", error);
  };

  const handleViewLot = () => {
    router.push(`/trazabilidad/demo`);
  };

  const handleScanAgain = () => {
    setScannedData(null);
    setIsScanning(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-black hover:text-gray-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <QrCode className="w-8 h-8 text-black" />
              <h1 className="text-3xl font-bold text-black">Escanear Código QR</h1>
            </div>
            <p className="text-gray-600">
              Apunta tu cámara al código QR del lote de vino
            </p>
          </div>

          {isScanning ? (
            <div className="bg-white rounded-2xl border-2 border-black shadow-xl overflow-hidden">
              <div className="aspect-square max-w-md mx-auto">
                <Scanner
                  onScan={(detectedCodes) => {
                    if (detectedCodes && detectedCodes.length > 0) {
                      handleScan(detectedCodes[0].rawValue);
                    }
                  }}
                  onError={handleError}
                />
              </div>
              <div className="p-6 text-center border-t border-black">
                <p className="text-sm text-gray-600">
                  Posiciona el código QR dentro del marco
                </p>
              </div>
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
                QR Escaneado Exitosamente
              </h2>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Código escaneado:</p>
                <p className="text-lg font-mono text-black break-all">
                  {scannedData}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleViewLot}
                  className="flex-1 bg-black text-white px-6 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
                >
                  Ver Información del Lote
                </button>
                <button
                  onClick={handleScanAgain}
                  className="flex-1 bg-white text-black px-6 py-4 rounded-lg font-semibold border-2 border-black hover:bg-gray-50 transition-colors"
                >
                  Escanear Otro
                </button>
              </div>
            </motion.div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Esta función utiliza la cámara de tu dispositivo para escanear códigos QR
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
