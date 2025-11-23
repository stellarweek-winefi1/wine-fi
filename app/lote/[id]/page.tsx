"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Wine, Calendar, MapPin, FileText, Plus, ExternalLink, QrCode, X, Settings, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getWineToken, getCurrentLotStatusByAddress, getLotStatusHistory, updateLotStatus, LotStatus } from "@/lib/wine-tokens";
import { supabaseClient } from "@/lib/supabaseClient";
import StatusManager from "@/app/lotes/nuevo/components/StatusManager";
import { cn } from "@/lib/utils";

const mockLote = {
  id: "demo",
  nombre: "Cabernet Sauvignon 2023",
  varietal: "Cabernet Sauvignon",
  año: 2023,
  cantidad: 500,
  region: "Valle de Colchagua, Chile",
  estado: "En producción",
  descripcion: "Lote premium de Cabernet Sauvignon producido en el Valle de Colchagua. Cosecha manual y fermentación controlada.",
};

const mockEvents = [
  {
    id: 1,
    evento: "Cosecha",
    fecha: "2024-03-15",
    descripcion: "Cosecha manual completada en las primeras horas de la mañana",
  },
  {
    id: 2,
    evento: "Fermentación iniciada",
    fecha: "2024-03-20",
    descripcion: "Inicio de fermentación en tanques de acero inoxidable",
  },
  {
    id: 3,
    evento: "Control de calidad",
    fecha: "2024-04-10",
    descripcion: "Análisis químico y sensorial completado",
  },
];

export default function LotePage() {
  const params = useParams();
  const tokenAddress = params.id as string;
  
  const [wineToken, setWineToken] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    evento: "",
    fecha: "",
    descripcion: "",
  });

  useEffect(() => {
    if (tokenAddress) {
      loadTokenData();
    }
  }, [tokenAddress]);

  const loadTokenData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load token data
      const token = await getWineToken(tokenAddress);
      if (!token) {
        setError("Token no encontrado");
        setIsLoading(false);
        return;
      }
      setWineToken(token);

      // Load current status
      const status = await getCurrentLotStatusByAddress(tokenAddress);
      if (status) {
        setCurrentStatus(status.status);
      }

      // Load status history
      if (token.id) {
        const history = await getLotStatusHistory(token.id);
        if (history && history.history) {
          setStatusHistory(history.history);
          // Transform status history to events format
          const transformedEvents = history.history.map((event: any) => ({
            id: event.id,
            evento: event.status,
            fecha: new Date(event.event_timestamp).toISOString().split('T')[0],
            descripcion: event.notes || `Estado cambiado a ${event.status}`,
            transaction_hash: event.transaction_hash,
            location: event.location,
          }));
          setEvents(transformedEvents);
        }
      }
    } catch (err) {
      console.error("Error loading token data:", err);
      setError(err instanceof Error ? err.message : "Error al cargar los datos del lote");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdated = async (event: any) => {
    if (event && event.status) {
      setCurrentStatus(event.status);
    }
    // Reload data
    await loadTokenData();
    setShowStatusManager(false);
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const event = {
      id: events.length + 1,
      ...newEvent,
    };
    setEvents([...events, event]);
    setNewEvent({ evento: "", fecha: "", descripcion: "" });
    setShowModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-black mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos del lote...</p>
        </div>
      </div>
    );
  }

  if (error || !wineToken) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/lotes"
            className="inline-flex items-center gap-2 text-black hover:text-gray-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver a Lotes</span>
          </Link>
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-red-700">{error || "Lote no encontrado"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metadata = wineToken.wine_metadata || {};
  const statusLabel = currentStatus 
    ? currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)
    : "Sin estado";

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/lotes"
          className="inline-flex items-center gap-2 text-black hover:text-gray-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver a Lotes</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border-2 border-black rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Wine className="w-8 h-8 text-black" />
                    <div>
                      <h1 className="text-3xl font-bold text-black">
                        {wineToken.name || metadata.winery_name || "Lote de Vino"}
                      </h1>
                      <p className="text-gray-600">{metadata.varietal || wineToken.symbol}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold",
                      currentStatus 
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {statusLabel}
                    </span>
                    {tokenAddress && (
                      <button
                        onClick={() => setShowStatusManager(true)}
                        className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-xs"
                      >
                        <Settings className="w-3 h-3" />
                        Actualizar Estado
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-6">{metadata.description || wineToken.name}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <div>
                      <p className="text-xs text-gray-500">Región</p>
                      <p className="font-semibold text-black">{metadata.region || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-5 h-5" />
                    <div>
                      <p className="text-xs text-gray-500">Año</p>
                      <p className="font-semibold text-black">{metadata.vintage || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Wine className="w-5 h-5" />
                    <div>
                      <p className="text-xs text-gray-500">Cantidad</p>
                      <p className="font-semibold text-black">{metadata.bottle_count || 0} botellas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="w-5 h-5" />
                    <div>
                      <p className="text-xs text-gray-500">Token Address</p>
                      <p className="font-semibold text-black text-xs font-mono break-all">{tokenAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white border-2 border-black rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-black" />
                  <h2 className="text-xl font-bold text-black">Documentos</h2>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-700">Certificado de origen</span>
                    <span className="text-xs text-gray-500">PDF</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-700">Análisis de calidad</span>
                    <span className="text-xs text-gray-500">PDF</span>
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              <div className="bg-white border-2 border-black rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-black" />
                    <h2 className="text-xl font-bold text-black">Historial de Estados</h2>
                  </div>
                  {tokenAddress && (
                    <button
                      onClick={() => setShowStatusManager(true)}
                      className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Actualizar Estado
                    </button>
                  )}
                </div>

                {statusHistory.length > 0 ? (
                  <div className="space-y-4">
                    {statusHistory.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-black rounded-full" />
                          {index < statusHistory.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-300 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-black capitalize">{event.status}</p>
                            {event.transaction_hash && (
                              <span className="text-xs text-gray-500 font-mono">
                                TX: {event.transaction_hash.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-1">
                            {new Date(event.event_timestamp).toLocaleString('es-ES')}
                          </p>
                          {event.location && (
                            <p className="text-xs text-gray-600 mb-1">
                              📍 {event.location}
                            </p>
                          )}
                          {event.notes && (
                            <p className="text-sm text-gray-700">{event.notes}</p>
                          )}
                          {event.previous_status && (
                            <p className="text-xs text-gray-500 mt-1">
                              Anterior: <span className="capitalize">{event.previous_status}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No hay historial de estados aún.</p>
                    <p className="text-sm mt-2">Establece el primer estado para comenzar el seguimiento.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* QR Code */}
              <div className="bg-white border-2 border-black rounded-xl shadow-lg p-6 text-center">
                <QrCode className="w-12 h-12 text-black mx-auto mb-4" />
                <h3 className="text-lg font-bold text-black mb-2">Código QR</h3>
                <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-8 mb-4">
                  <div className="aspect-square bg-white flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Código QR para trazabilidad del lote
                </p>
                <button className="w-full bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm">
                  Descargar QR
                </button>
              </div>

              {/* Public Page Link */}
              <div className="bg-white border-2 border-black rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-black mb-4">Página Pública</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Comparte la página pública de trazabilidad con tus clientes
                </p>
                <Link
                  href={`/trazabilidad/${params.id}`}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 w-full bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver Página Pública
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status Manager Modal */}
      <AnimatePresence>
        {showStatusManager && tokenAddress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowStatusManager(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto border-2 border-black"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">Gestionar Estado del Lote</h3>
                <button
                  onClick={() => setShowStatusManager(false)}
                  className="text-gray-500 hover:text-black transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <StatusManager
                tokenAddress={tokenAddress}
                currentStatus={currentStatus}
                onStatusUpdated={handleStatusUpdated}
                onClose={() => setShowStatusManager(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
