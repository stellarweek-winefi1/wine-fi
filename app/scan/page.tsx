"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, QrCode, Loader2 } from "lucide-react";
import Link from "next/link";
import { getBottleTraceabilityByQR } from "@/lib/wine-tokens";

export default function ScanPage() {
  const router = useRouter();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isLoadingTraceability, setIsLoadingTraceability] = useState(false);
  const [bottleInfo, setBottleInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (result: string) => {
    if (result && isScanning) {
      setScannedData(result);
      setIsScanning(false);
      setIsLoadingTraceability(true);
      setError(null);

      try {
        // Try to fetch bottle traceability
        const traceability = await getBottleTraceabilityByQR(result);
        
        if (traceability) {
          setBottleInfo(traceability);
        } else {
          setError("No se encontró información para este código QR");
        }
      } catch (err) {
        console.error("Error fetching traceability:", err);
        setError("Error al cargar la información del lote");
      } finally {
        setIsLoadingTraceability(false);
      }
    }
  };

  const handleError = (error: unknown) => {
    console.error("QR Scanner Error:", error);
  };

  const handleViewBottle = () => {
    if (bottleInfo?.bottle?.id) {
      router.push(`/bottle/${bottleInfo.bottle.id}`);
    }
  };

  const handleViewLot = () => {
    if (bottleInfo?.wine?.id) {
      router.push(`/trazabilidad/${bottleInfo.wine.id}`);
    } else {
      // Fallback to old demo page
      router.push(`/trazabilidad/demo`);
    }
  };

  const handleScanAgain = () => {
    setScannedData(null);
    setBottleInfo(null);
    setError(null);
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
          ) : isLoadingTraceability ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border-2 border-black shadow-xl p-8"
            >
              <div className="flex items-center justify-center mb-6">
                <Loader2 className="w-12 h-12 text-black animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-black text-center mb-4">
                Verificando Autenticidad...
              </h2>
              <p className="text-gray-600 text-center">
                Consultando la blockchain para verificar el producto
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl border-2 border-black shadow-xl p-8"
            >
              <div className="flex items-center justify-center mb-6">
                <div className={`${error ? 'bg-red-100' : 'bg-green-100'} rounded-full p-4`}>
                  <Check className={`w-12 h-12 ${error ? 'text-red-600' : 'text-green-600'}`} />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-black text-center mb-4">
                {error ? 'Error al Verificar' : 'Producto Verificado'}
              </h2>

              {error ? (
                <div className="bg-red-50 rounded-lg p-6 mb-6 border border-red-200">
                  <p className="text-red-800 text-center">{error}</p>
                </div>
              ) : bottleInfo ? (
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="font-bold text-lg mb-4">{bottleInfo.wine?.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Botella #</p>
                        <p className="font-semibold">{bottleInfo.bottle?.number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Estado</p>
                        <p className="font-semibold capitalize">
                          {bottleInfo.bottle?.current_status?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Cosecha</p>
                        <p className="font-semibold">{bottleInfo.wine?.metadata?.vintage || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Región</p>
                        <p className="font-semibold">{bottleInfo.wine?.metadata?.region || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {bottleInfo.authenticity?.verified && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-2 text-green-700">
                          <Check className="w-5 h-5" />
                          <span className="font-semibold">
                            Autenticidad Verificada en Blockchain
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 text-center mt-2">
                          {bottleInfo.authenticity.total_events} eventos registrados
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Código escaneado:</p>
                    <p className="text-sm font-mono text-black break-all">
                      {scannedData}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Código escaneado:</p>
                  <p className="text-lg font-mono text-black break-all">
                    {scannedData}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                {!error && bottleInfo && (
                  <>
                    <button
                      onClick={handleViewBottle}
                      className="flex-1 bg-black text-white px-6 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
                    >
                      Ver Historial de Botella
                    </button>
                    <button
                      onClick={handleViewLot}
                      className="flex-1 bg-gray-800 text-white px-6 py-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors shadow-lg"
                    >
                      Ver Lote Completo
                    </button>
                  </>
                )}
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
