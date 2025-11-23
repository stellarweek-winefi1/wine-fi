"use client";

import { motion } from "framer-motion";
import { Wine, Plus, Eye, Calendar, MapPin, Search, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const mockLotes = [
  {
    id: "catena-zapata",
    nombre: "Catena Zapata Malbec Argentino",
    varietal: "Malbec",
    año: 2020,
    cantidad: 3000,
    region: "Luján de Cuyo, Mendoza, Argentina",
    estado: "Certificado",
    wtt: "CATENA-ZAPATA-2020-CERT",
    ultimoEvento: "Lote certificado",
    fecha: "2024-01-15",
    eventos: 3,
    priceUSDC: 2500,
    isSold: false,
  },
  {
    id: "almaviva-2018",
    nombre: "Almaviva 2018",
    varietal: "Bordeaux Blend",
    año: 2018,
    cantidad: 2000,
    region: "Valle de Maipo, Chile",
    estado: "Certificado",
    wtt: "ALMAVIVA-2018-CERT",
    ultimoEvento: "Embotellado completado",
    fecha: "2024-02-20",
    eventos: 5,
    priceUSDC: 3200,
    isSold: false,
  },
  {
    id: "achaval-ferrer",
    nombre: "Achaval-Ferrer Finca Bella Vista",
    varietal: "Malbec",
    año: 2019,
    cantidad: 4500,
    region: "Valle de Uco, Mendoza, Argentina",
    estado: "Certificado",
    wtt: "ACHAVAL-FERRER-2019-CERT",
    ultimoEvento: "En barrica",
    fecha: "2024-03-10",
    eventos: 4,
    priceUSDC: 2800,
    isSold: false,
  },
  {
    id: "don-melchor-2019",
    nombre: "Don Melchor 2019",
    varietal: "Cabernet Sauvignon",
    año: 2019,
    cantidad: 2500,
    region: "Puente Alto, Valle de Maipo, Chile",
    estado: "Certificado",
    wtt: "DON-MELCHOR-2019-CERT",
    ultimoEvento: "Crianza completada",
    fecha: "2024-04-05",
    eventos: 6,
    priceUSDC: 3500,
    isSold: false,
  },
  {
    id: "sena-2020",
    nombre: "Seña 2020",
    varietal: "Bordeaux Blend",
    año: 2020,
    cantidad: 1800,
    region: "Valle de Aconcagua, Chile",
    estado: "Certificado",
    wtt: "SENA-2020-CERT",
    ultimoEvento: "Embotellado completado",
    fecha: "2024-04-12",
    eventos: 5,
    priceUSDC: 4200,
    isSold: false,
  },
  {
    id: "vega-sicilia-2018",
    nombre: "Vega Sicilia Unico 2018",
    varietal: "Tempranillo Blend",
    año: 2018,
    cantidad: 1200,
    region: "Ribera del Duero, España",
    estado: "Certificado",
    wtt: "VEGA-SICILIA-2018-CERT",
    ultimoEvento: "En crianza",
    fecha: "2024-03-25",
    eventos: 4,
    priceUSDC: 5800,
    isSold: false,
  },
  {
    id: "opus-one-2019",
    nombre: "Opus One 2019",
    varietal: "Bordeaux Blend",
    año: 2019,
    cantidad: 2800,
    region: "Oakville, Napa Valley, USA",
    estado: "Certificado",
    wtt: "OPUS-ONE-2019-CERT",
    ultimoEvento: "Crianza en barrica",
    fecha: "2024-05-01",
    eventos: 7,
    priceUSDC: 6500,
    isSold: false,
  },
  {
    id: "penfolds-grange-2018",
    nombre: "Penfolds Grange 2018",
    varietal: "Shiraz",
    año: 2018,
    cantidad: 1500,
    region: "Barossa Valley, Australia",
    estado: "Certificado",
    wtt: "PENFOLDS-GRANGE-2018-CERT",
    ultimoEvento: "Embotellado completado",
    fecha: "2024-04-18",
    eventos: 6,
    priceUSDC: 5200,
    isSold: false,
  },
  {
    id: "sassicaia-2020",
    nombre: "Tenuta San Guido Sassicaia 2020",
    varietal: "Cabernet Sauvignon",
    año: 2020,
    cantidad: 3200,
    region: "Bolgheri, Toscana, Italia",
    estado: "Certificado",
    wtt: "SASSICAIA-2020-CERT",
    ultimoEvento: "Crianza en barrica",
    fecha: "2024-04-28",
    eventos: 5,
    priceUSDC: 4800,
    isSold: false,
  },
  {
    id: "caymus-2019",
    nombre: "Caymus Vineyards Cabernet 2019",
    varietal: "Cabernet Sauvignon",
    año: 2019,
    cantidad: 5000,
    region: "Rutherford, Napa Valley, USA",
    estado: "Certificado",
    wtt: "CAYMUS-2019-CERT",
    ultimoEvento: "Embotellado completado",
    fecha: "2024-03-15",
    eventos: 4,
    priceUSDC: 3200,
    isSold: false,
  },
  {
    id: "dominio-eguren-2020",
    nombre: "Dominio de Eguren Protocolo 2020",
    varietal: "Tempranillo",
    año: 2020,
    cantidad: 4000,
    region: "La Rioja, España",
    estado: "Certificado",
    wtt: "DOMINIO-EGUREN-2020-CERT",
    ultimoEvento: "En crianza",
    fecha: "2024-04-20",
    eventos: 3,
    priceUSDC: 1800,
    isSold: false,
  },
  {
    id: "concha-y-toro-2020",
    nombre: "Concha y Toro Don Melchor 2020",
    varietal: "Cabernet Sauvignon",
    año: 2020,
    cantidad: 3500,
    region: "Puente Alto, Chile",
    estado: "Certificado",
    wtt: "CONCHA-TORO-2020-CERT",
    ultimoEvento: "Embotellado completado",
    fecha: "2024-05-10",
    eventos: 6,
    priceUSDC: 3600,
    isSold: false,
  },
  {
    id: "luce-2019",
    nombre: "Luce della Vite Luce 2019",
    varietal: "Sangiovese Merlot",
    año: 2019,
    cantidad: 2200,
    region: "Montalcino, Toscana, Italia",
    estado: "Certificado",
    wtt: "LUCE-2019-CERT",
    ultimoEvento: "Crianza completada",
    fecha: "2024-04-15",
    eventos: 5,
    priceUSDC: 3900,
    isSold: false,
  },
  {
    id: "zuccardi-2020",
    nombre: "Zuccardi Q Malbec 2020",
    varietal: "Malbec",
    año: 2020,
    cantidad: 4800,
    region: "Paraje Altamira, Uco Valley, Argentina",
    estado: "Certificado",
    wtt: "ZUCCARDI-Q-2020-CERT",
    ultimoEvento: "En barrica",
    fecha: "2024-05-05",
    eventos: 4,
    priceUSDC: 2400,
    isSold: false,
  },
  {
    id: "bodegas-numanthia-2018",
    nombre: "Bodegas Numanthia Termes 2018",
    varietal: "Tinta de Toro",
    año: 2018,
    cantidad: 2600,
    region: "Toro, Castilla y León, España",
    estado: "Certificado",
    wtt: "NUMANTHIA-2018-CERT",
    ultimoEvento: "Embotellado completado",
    fecha: "2024-03-30",
    eventos: 6,
    priceUSDC: 3100,
    isSold: false,
  },
];

export default function LotesPage() {
  const { t } = useLanguage();
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
            {t.lotes.title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-black max-w-3xl mx-auto px-4">
            {t.lotes.subtitle}
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 sm:mb-8 md:mb-12 px-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <label htmlFor="search-lotes" className="sr-only">
              {t.lotes.searchLabel}
            </label>
            <Search
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-black"
              aria-hidden="true"
            />
            <input
              id="search-lotes"
              type="search"
              placeholder={t.lotes.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-xl border border-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base sm:text-lg"
              aria-label={t.lotes.searchLabel}
            />
          </div>

          <Link
            href="/lotes/nuevo"
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg text-sm sm:text-base whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            {t.lotes.newLot}
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

                  {/* Certificate Badge */}
                  <div className="bg-black text-white rounded-lg p-2 sm:p-3 mb-4">
                    <div className="text-xs text-gray-300 mb-1">{t.lotes.certified}</div>
                    <div className="text-xs sm:text-sm font-mono font-semibold truncate">
                      {lote.wtt}
                    </div>
                  </div>

                  {/* Price */}
                  {lote.priceUSDC && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-1">{t.lotes.price}</div>
                      <div className="text-2xl sm:text-3xl font-bold text-black">
                        {lote.priceUSDC.toLocaleString()} USDC
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  <div className="space-y-2 sm:space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{lote.region}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{t.lotes.year}: {lote.año} • {t.lotes.varietal}: {lote.varietal}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {t.lotes.quantity}: <span className="font-semibold text-black">{lote.cantidad.toLocaleString()} {t.lotes.bottles}</span>
                    </div>
                  </div>

                  {/* Last Event */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <p className="text-xs text-gray-500">{t.lotes.lastEvent}</p>
                    </div>
                    <p className="text-sm font-semibold text-black">{lote.ultimoEvento}</p>
                    <p className="text-xs text-gray-500 mt-1">{lote.fecha}</p>
                    <p className="text-xs text-gray-500 mt-1">{lote.eventos} {t.lotes.eventsRegistered}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t-2 border-black p-4 bg-gray-50">
                  <Link
                    href={`/lote/${lote.id}`}
                    className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors w-full text-sm sm:text-base"
                  >
                    <Eye className="w-4 h-4" />
                    {t.lotes.viewTraceability}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Wine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {t.lotes.noLotesFound}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? t.lotes.tryOtherSearch : t.lotes.noLotesMessage}
            </p>
            {!searchQuery && (
              <Link
                href="/lotes/nuevo"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t.lotes.createFirstLot}
              </Link>
            )}
          </div>
        )}

        {/* Count */}
        {filteredLotes.length > 0 && (
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-sm text-gray-600">
              {t.lotes.showing} {filteredLotes.length} {filteredLotes.length === 1 ? t.lotes.lot : t.lotes.lots} {filteredLotes.length === 1 ? t.lotes.certifiedSingle : t.lotes.certifiedPlural}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

