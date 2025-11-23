"use client";

import { motion } from "framer-motion";
import { Wine, Calendar, MapPin, QrCode, Shield, Eye } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const mockLote = {
  id: "demo",
  nombre: "Cabernet Sauvignon 2023",
  varietal: "Cabernet Sauvignon",
  año: 2023,
  cantidad: 500,
  region: "Valle de Colchagua, Chile",
  estado: "En producción",
  descripcion: "Lote premium de Cabernet Sauvignon producido en el Valle de Colchagua. Cosecha manual y fermentación controlada.",
  productor: "Viña Premium Chile",
};

const mockEvents = [
  {
    id: 1,
    evento: "Cosecha",
    fecha: "2024-03-15",
    descripcion: "Cosecha manual completada en las primeras horas de la mañana",
    verificado: true,
  },
  {
    id: 2,
    evento: "Fermentación iniciada",
    fecha: "2024-03-20",
    descripcion: "Inicio de fermentación en tanques de acero inoxidable",
    verificado: true,
  },
  {
    id: 3,
    evento: "Control de calidad",
    fecha: "2024-04-10",
    descripcion: "Análisis químico y sensorial completado",
    verificado: true,
  },
  {
    id: 4,
    evento: "Embotellado",
    fecha: "2024-05-15",
    descripcion: "Proceso de embotellado completado con estándares de calidad",
    verificado: true,
  },
];

export default function TrazabilidadPage() {
  const { t } = useLanguage();
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
            <span>{t.trazabilidad.verified} en Stellar</span>
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
                      {mockLote.nombre}
                    </h1>
                    <p className="text-gray-300">{mockLote.productor}</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-400 text-black">
                  <Shield className="w-4 h-4 mr-2" />
                  Verificado
                </span>
              </div>

              <p className="text-gray-200 mb-6">{mockLote.descripcion}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Varietal</p>
                  <p className="font-semibold">{mockLote.varietal}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Año</p>
                  <p className="font-semibold">{mockLote.año}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Región</p>
                  <p className="font-semibold">{mockLote.region}</p>
                </div>
              </div>
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
                      Esta página demostrativa para el hackathon muestra la trazabilidad completa del lote desde la cosecha hasta el embotellado, verificada en la blockchain de Stellar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="w-6 h-6 text-black" />
                  <h2 className="text-2xl font-bold text-black">
                    Historial de Trazabilidad
                  </h2>
                </div>

                <div className="space-y-6">
                  {mockEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 ${event.verificado ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {index < mockEvents.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 mt-2 min-h-[60px]" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-black text-lg">
                              {event.evento}
                            </h3>
                            {event.verificado && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                <Shield className="w-3 h-3 mr-1" />
                                {t.trazabilidad.verified}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            {new Date(event.fecha).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-gray-700">{event.descripcion}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* QR Section */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center">
                <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-black mb-2">
                  Código QR del Lote
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  ID del Lote: <span className="font-mono font-semibold">{mockLote.id}</span>
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
              Powered by Winefy - Trazabilidad verificada en Stellar Blockchain
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
