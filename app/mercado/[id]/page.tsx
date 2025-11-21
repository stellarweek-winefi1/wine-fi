"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { MapPin, TrendingUp, ArrowLeft, Clock, CheckCircle, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// Wine data - in a real app, this would come from an API or database
const wines = [
  {
    id: "catena-zapata",
    name: "Catena Zapata Malbec Argentino",
    region: "Luján de Cuyo",
    country: "Mendoza, Argentina",
    countryFlag: "🇦🇷",
    rating: 95,
    pricePerUnit: 120,
    annualReturn: 8.2,
    available: 2100,
    total: 3000,
    description: "Un Malbec excepcional de la reconocida bodega Catena Zapata, con notas de frutos rojos y especias.",
  },
  {
    id: "almaviva-2018",
    name: "Almaviva 2018",
    region: "Valle de Maipo",
    country: "Chile",
    countryFlag: "🇨🇱",
    rating: 96,
    pricePerUnit: 180,
    annualReturn: 9.1,
    available: 1450,
    total: 2000,
    description: "Un vino premium resultado de la colaboración entre Concha y Toro y Baron Philippe de Rothschild.",
  },
  {
    id: "achaval-ferrer",
    name: "Achaval-Ferrer Finca Bella Vista",
    region: "Valle de Uco",
    country: "Mendoza, Argentina",
    countryFlag: "🇦🇷",
    rating: 94,
    pricePerUnit: 95,
    annualReturn: 7.8,
    available: 3200,
    total: 4500,
    description: "Un Malbec de alta expresión que refleja el terroir único del Valle de Uco.",
  },
];

export default function LoteDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [wine, setWine] = useState<typeof wines[0] | null>(null);

  useEffect(() => {
    const foundWine = wines.find((w) => w.id === id);
    if (foundWine) {
      setWine(foundWine);
    }
  }, [id]);

  if (!wine) {
    return (
      <main className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-xl text-black mb-4">Lote no encontrado</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-black hover:text-gray-800 underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-black hover:text-gray-800 mb-4 sm:mb-6 md:mb-8 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          <span className="font-medium">Volver al dashboard</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Wine Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border-2 border-black rounded-2xl overflow-hidden"
            >
              {/* Wine Image */}
              <div className="bg-black h-48 sm:h-56 md:h-64 flex items-center justify-center">
                <div className="text-6xl sm:text-7xl md:text-8xl" role="img" aria-label="Vino">
                  🍷
                </div>
              </div>

              {/* Wine Info */}
              <div className="p-4 sm:p-5 md:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black flex-1 pr-2">
                    {wine.name}
                  </h1>
                  <div className="bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <span aria-hidden="true">⭐</span>
                    <span>{wine.rating}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-black mb-4 sm:mb-5 md:mb-6">
                  <span className="text-lg sm:text-xl flex-shrink-0">{wine.countryFlag}</span>
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base truncate">{wine.region}, {wine.country}</span>
                </div>

                {/* Description */}
                {wine.description && (
                  <p className="text-sm sm:text-base text-black mb-4 sm:mb-5 md:mb-6 leading-relaxed">
                    {wine.description}
                  </p>
                )}

                {/* Lote Info */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-xs text-black mb-1">Total Botellas</div>
                    <div className="text-xl sm:text-2xl font-bold text-black">{wine.total}</div>
                  </div>
                  <div>
                    <div className="text-xs text-black mb-1">Estado</div>
                    <div className="text-xl sm:text-2xl font-bold text-black flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                      Certificado
                    </div>
                  </div>
                </div>

                {/* WTT Info */}
                <div className="mb-6 p-4 bg-black text-white rounded-lg">
                  <div className="text-xs text-gray-300 mb-1">Wine Traceability Token (WTT)</div>
                  <div className="text-sm font-mono font-semibold break-all">
                    {wine.id.toUpperCase()}-WTT
                  </div>
                  <div className="text-xs text-gray-300 mt-2">
                    Verificado en Stellar Blockchain
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Traceability Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border-2 border-black rounded-2xl p-4 sm:p-6 md:p-8"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-5 md:mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                Timeline de Trazabilidad
              </h2>

              {/* Traceability Events */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="bg-black w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-black mb-1">Lote Certificado</div>
                    <div className="text-sm text-gray-600">WTT generado en Stellar</div>
                    <div className="text-xs text-gray-500 mt-1">Hace 2 días</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="bg-black w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-black mb-1">Cosecha Registrada</div>
                    <div className="text-sm text-gray-600">Evento registrado en blockchain</div>
                    <div className="text-xs text-gray-500 mt-1">Hace 1 mes</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="bg-gray-300 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-600 mb-1">En Barrica</div>
                    <div className="text-sm text-gray-500">Proceso en curso</div>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-black text-center">
                <QrCode className="w-16 h-16 mx-auto mb-4 text-black" />
                <h3 className="font-semibold text-black mb-2">Código QR del Lote</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Escanea este código para verificar la autenticidad y ver la trazabilidad completa
                </p>
                <div className="bg-white p-4 rounded-lg border border-black inline-block">
                  <div className="w-32 h-32 bg-black flex items-center justify-center text-white text-xs">
                    QR Code
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Código único: {wine.id.toUpperCase()}
                </p>
              </div>

              {/* Verify on Blockchain */}
              <div className="mt-6 p-4 bg-black text-white rounded-lg text-center">
                <p className="text-sm mb-2">Verificado en Stellar Blockchain</p>
                <p className="text-xs text-gray-300">
                  Todos los eventos son inmutables y verificables públicamente
                </p>
              </div>
            </motion.div>
          </div>
      </div>
    </main>
  );
}

