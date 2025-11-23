"use client";

import { motion } from "framer-motion";
import {
  Wine,
  Calendar,
  QrCode,
  Shield,
  Eye,
  RefreshCw,
  CircleAlert,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type LotTraceabilityResponse = {
  success?: boolean;
  lot?: LotData | null;
  events?: TraceEvent[];
  eventCount?: number;
  error?: string;
};

type LotData = {
  id: string;
  lotId: string | null;
  wineryName: string | null;
  region: string | null;
  country: string | null;
  appellation: string | null;
  vineyard: string | null;
  vintage: number | null;
  bottleFormatMl: number | null;
  bottleCount: number | null;
  description: string | null;
  tokenCode: string | null;
  status: string | null;
  documentationUrls: string[] | null;
  tokenMetadata: Record<string, any> | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type TraceEvent = {
  id: string;
  eventType: string;
  actorAddress: string | null;
  description: string | null;
  timestamp: string;
  onChainTxHash: string | null;
};

const formatDate = (timestamp?: string | null) => {
  if (!timestamp) return "Fecha desconocida";
  return new Date(timestamp).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const prettifyEventType = (eventType?: string) => {
  if (!eventType) return "Evento";
  return eventType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const shortenAddress = (value?: string | null, chars = 6) => {
  if (!value) return "Dato no disponible";
  if (value.length <= chars * 2) return value;
  return `${value.slice(0, chars)}…${value.slice(-chars)}`;
};

const LoadingState = () => (
  <div className="space-y-4">
    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
    <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
    <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={`skeleton-${idx}`} className="space-y-2">
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-5 w-full bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
    <div className="flex items-center gap-2 text-red-700 font-semibold">
      <CircleAlert className="w-5 h-5" />
      <span>{message}</span>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      Reintentar
    </button>
  </div>
);

export default function TrazabilidadPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const lotIdParam = searchParams.get("lotId");
  const wineLotIdParam = searchParams.get("wineLotId");
  const routeIdentifier = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const identifierValue = (lotIdParam || wineLotIdParam || routeIdentifier || "").trim();
  
  // Determine identifier type
  let identifierType: string;
  let identifierValueToUse: string;
  if (wineLotIdParam) {
    identifierType = "wineLotId";
    identifierValueToUse = wineLotIdParam;
  } else {
    identifierType = "lotId";
    identifierValueToUse = identifierValue;
  }

  const [lot, setLot] = useState<LotData | null>(null);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTraceability = useCallback(async () => {
    if (!identifierValueToUse) {
      setErrorMessage("Falta el identificador del lote.");
      setIsLoading(false);
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setErrorMessage(
        "Variables de entorno de Supabase no configuradas. Revisa tu archivo .env.local.",
      );
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Try new wine lots API first (using token_id)
      const lotStatusEndpoint = `${supabaseUrl}/functions/v1/wine-lots-get-history?token_id=${encodeURIComponent(identifierValueToUse)}&include_metadata=true`;
      const lotStatusResponse = await fetch(lotStatusEndpoint, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (lotStatusResponse.ok) {
        const lotData = await lotStatusResponse.json();
        
        // Transform to expected format
        const transformedLot: LotData = {
          id: lotData.token.id,
          lotId: lotData.token.wine_metadata?.lot_id || null,
          wineryName: lotData.token.wine_metadata?.winery_name || lotData.token.name,
          region: lotData.token.wine_metadata?.region || null,
          country: lotData.token.wine_metadata?.country || null,
          appellation: null,
          vineyard: null,
          vintage: lotData.token.wine_metadata?.vintage || null,
          bottleFormatMl: null,
          bottleCount: lotData.token.wine_metadata?.bottle_count || null,
          description: lotData.token.wine_metadata?.description || null,
          tokenCode: lotData.token.symbol,
          status: lotData.current_status?.status || null,
          documentationUrls: null,
          tokenMetadata: lotData.token.wine_metadata || null,
          createdAt: null,
          updatedAt: null,
        };

        const transformedEvents: TraceEvent[] = (lotData.history || []).map((event: any) => ({
          id: event.id,
          eventType: event.status,
          actorAddress: event.handler_name || null,
          description: event.notes || `Estado cambiado a ${event.status}`,
          timestamp: event.event_timestamp,
          onChainTxHash: event.transaction_hash || null,
        }));

        setLot(transformedLot);
        setEvents(transformedEvents);
        return;
      }

      // Fallback to old API
      const endpoint = `${supabaseUrl}/functions/v1/get-bottle-traceability?${identifierType}=${encodeURIComponent(identifierValueToUse)}`;
      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      const payload = (await response.json()) as LotTraceabilityResponse;

      if (!response.ok) {
        throw new Error(payload.error || "No pudimos obtener la trazabilidad.");
      }

      if (!payload.lot) {
        throw new Error("No encontramos datos para este lote.");
      }

      setLot(payload.lot);
      setEvents(payload.events || []);
    } catch (error) {
      setLot(null);
      setEvents([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al cargar la trazabilidad.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [identifierType, identifierValueToUse]);

  useEffect(() => {
    fetchTraceability();
  }, [fetchTraceability]);

  const timelineEvents = useMemo(
    () =>
      events.map((event, index) => ({
        id: event.id,
        title: prettifyEventType(event.eventType),
        description:
          event.description ||
          "Evento registrado sin descripción detallada disponible.",
        date: formatDate(event.timestamp),
        verified: event.eventType !== "scanned",
        index,
      })),
    [events],
  );

  const lotLocation = useMemo(() => {
    if (!lot) return "Ubicación no disponible";
    const parts = [lot.region, lot.country].filter(Boolean);
    return parts.length ? parts.join(", ") : "Ubicación no disponible";
  }, [lot]);

  const heroDescription = useMemo(() => {
    if (!lot) {
      return "Cargando trazabilidad verificada en la red Stellar.";
    }

    const pieces = [
      lot.wineryName ? `${lot.wineryName}` : null,
      lot.vintage ? `Cosecha ${lot.vintage}` : null,
      lotLocation !== "Ubicación no disponible" ? lotLocation : null,
      lot.bottleCount ? `${lot.bottleCount} botellas` : null,
    ].filter(Boolean);

    return pieces.join(" • ") || "Detalle de lote registrado en la red.";
  }, [lot, lotLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-black text-white py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wine className="w-6 h-6" />
            <span className="font-bold text-lg">Winefy</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4" />
            <span>Verificado en Stellar</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Main Card */}
          <div className="bg-white border-2 border-black rounded-2xl shadow-2xl overflow-hidden mb-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Wine className="w-10 h-10" />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">
                      {lot?.wineryName || "Lote en verificación"}
                    </h1>
                    <p className="text-gray-300">
                      {lot?.region && lot?.country ? `${lot.region}, ${lot.country}` : lot?.lotId || "Lote de vino"}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-400 text-black">
                  <Shield className="w-4 h-4 mr-2" />
                  {events.length ? "Eventos registrados" : "Esperando eventos"}
                </span>
              </div>

              {isLoading ? (
                <LoadingState />
              ) : (
                <>
                  <p className="text-gray-200 mb-6">{heroDescription}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Cosecha</p>
                      <p className="font-semibold">
                        {lot?.vintage ?? "Sin dato"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Ubicación</p>
                      <p className="font-semibold">{lotLocation}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Botellas</p>
                      <p className="font-semibold">
                        {lot?.bottleCount ?? "Sin dato"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {/* Info Notice */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-8">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">
                      Página Pública de Trazabilidad
                    </p>
                    <p className="text-sm text-blue-700">
                      Consulta en tiempo real la historia completa del lote
                      usando los Edge Functions de Supabase.
                    </p>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-8">
                  <ErrorState message={errorMessage} onRetry={fetchTraceability} />
                </div>
              )}

              {/* Timeline */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="w-6 h-6 text-black" />
                  <h2 className="text-2xl font-bold text-black">
                    Historial de Trazabilidad
                  </h2>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`loading-event-${index}`}
                        className="bg-gray-50 border border-gray-100 rounded-lg p-4 animate-pulse"
                      >
                        <div className="h-4 w-1/3 bg-gray-200 rounded mb-2" />
                        <div className="h-3 w-1/4 bg-gray-100 rounded mb-3" />
                        <div className="h-3 w-full bg-gray-100 rounded" />
                      </div>
                    ))}
                  </div>
                ) : timelineEvents.length ? (
                  <div className="space-y-6">
                    {timelineEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded-full flex-shrink-0 ${
                              event.verified ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                          {index < timelineEvents.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-300 mt-2 min-h-[60px]" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold text-black text-lg">
                                {event.title}
                              </h3>
                              {event.verified && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <Shield className="w-3 h-3 mr-1" />
                                  On-chain
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              {event.date}
                            </p>
                            <p className="text-gray-700">{event.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-500">
                    No hay eventos registrados todavía para este lote.
                  </div>
                )}
              </div>

              {/* QR Section */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center">
                <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-black mb-2">
                  Código QR del Lote
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  ID del Lote:{" "}
                  <span className="font-mono font-semibold">
                    {lot?.lotId || lot?.tokenCode || "Sin asignar"}
                  </span>
                </p>
                <div className="bg-white border-2 border-gray-300 rounded-lg p-6 inline-block">
                  <div className="w-32 h-32 flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Powered by Winefy - Trazabilidad verificada en Stellar
            </p>
            <Link
              href="/"
              className="text-sm text-black hover:text-gray-600 font-semibold transition-colors"
            >
              Conoce más sobre Winefy
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
