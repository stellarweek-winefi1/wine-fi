"use client";

import { motion } from "framer-motion";
import { Wine, Plus, Eye, Calendar, MapPin, Search, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const mockLotes = [
  {
    id: "catena-zapata",
    nombre: "Catena Zapata Malbec Argentino",
    varietal: "Malbec",
    año: 2020,
    cantidad: 3000,
    region: "Luján de Cuyo, Mendoza, Argentina",
    estado: "Certificado",
    wtt: "CATENA-ZAPATA-WTT",
    ultimoEvento: "Lote certificado",
    fecha: "2024-01-15",
    eventos: 3,
  },
  {
    id: "almaviva-2018",
    nombre: "Almaviva 2018",
    varietal: "Bordeaux Blend",
    año: 2018,
    cantidad: 2000,
    region: "Valle de Maipo, Chile",
    estado: "Certificado",
    wtt: "ALMAVIVA-2018-WTT",
    ultimoEvento: "Embotellado completado",
    fecha: "2024-02-20",
    eventos: 5,
  },
  {
    id: "achaval-ferrer",
    nombre: "Achaval-Ferrer Finca Bella Vista",
    varietal: "Malbec",
    año: 2019,
    cantidad: 4500,
    region: "Valle de Uco, Mendoza, Argentina",
    estado: "Certificado",
    wtt: "ACHAVAL-FERRER-WTT",
    ultimoEvento: "En barrica",
    fecha: "2024-03-10",
    eventos: 4,
  },
];

export default function LotesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLotes = mockLotes.filter((lote) =>
    lote.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lote.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lote.varietal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-white py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-black px-4">
            Lotes Certificados
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-black max-w-3xl mx-auto px-4">
            Visualiza todos los lotes certificados con Wine Traceability Tokens (WTT) en Stellar
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 sm:mb-8 md:mb-12 px-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <label htmlFor="search-lotes" className="sr-only">
              Buscar lotes
            </label>
            <Search
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-black"
              aria-hidden="true"
            />
            <input
              id="search-lotes"
              type="search"
              placeholder="Buscar por nombre, región o varietal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-xl border border-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base sm:text-lg"
              aria-label="Buscar lotes"
            />
          </div>

          <Link
            href="/lotes/nuevo"
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg text-sm sm:text-base whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Nuevo Lote
          </Link>
        </div>

        {/* Lotes Grid */}
        {filteredLotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {filteredLotes.map((lote, index) => (
              <motion.div
                key={lote.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white border-2 border-black rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full"
              >
                {/* Header */}
                <div className="p-4 sm:p-5 md:p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Wine className="w-5 h-5 sm:w-6 sm:h-6 text-black flex-shrink-0" />
                      <h3 className="text-lg sm:text-xl font-bold text-black truncate">
                        {lote.nombre}
                      </h3>
                    </div>
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex-shrink-0 ml-2">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {lote.estado}
                    </span>
                  </div>

                  {/* WTT Badge */}
                  <div className="bg-black text-white rounded-lg p-2 sm:p-3 mb-4">
                    <div className="text-xs text-gray-300 mb-1">WTT</div>
                    <div className="text-xs sm:text-sm font-mono font-semibold truncate">
                      {lote.wtt}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 sm:space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{lote.region}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Año: {lote.año} • Varietal: {lote.varietal}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Cantidad: <span className="font-semibold text-black">{lote.cantidad.toLocaleString()} botellas</span>
                    </div>
                  </div>

                  {/* Last Event */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <p className="text-xs text-gray-500">Último evento</p>
                    </div>
                    <p className="text-sm font-semibold text-black">{lote.ultimoEvento}</p>
                    <p className="text-xs text-gray-500 mt-1">{lote.fecha}</p>
                    <p className="text-xs text-gray-500 mt-1">{lote.eventos} eventos registrados</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t-2 border-black p-4 bg-gray-50">
                  <Link
                    href={`/lote/${lote.id}`}
                    className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors w-full text-sm sm:text-base"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Trazabilidad
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Wine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No se encontraron lotes
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? "Intenta con otros términos de búsqueda" : "Comienza creando tu primer lote certificado"}
            </p>
            {!searchQuery && (
              <Link
                href="/lotes/nuevo"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear Primer Lote
              </Link>
            )}
          </div>
        )}

        {/* Count */}
        {filteredLotes.length > 0 && (
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-sm text-gray-600">
              Mostrando {filteredLotes.length} {filteredLotes.length === 1 ? "lote" : "lotes"} certificado{filteredLotes.length === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

