"use client";

import { MapPin, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface WineCardProps {
  id: string;
  name: string;
  region: string;
  country: string;
  countryFlag: string;
  rating: number;
  pricePerUnit: number;
  annualReturn: number;
  available: number;
  total: number;
  image?: string;
}

export default function WineCard({
  id,
  name,
  region,
  country,
  countryFlag,
  rating,
  pricePerUnit,
  annualReturn,
  available,
  total,
}: WineCardProps) {
  const availabilityPercentage = (available / total) * 100;

  return (
    <motion.div
      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-black"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Wine Image */}
      <div className="bg-black h-48 sm:h-56 md:h-64 flex items-center justify-center">
        <div className="text-6xl sm:text-7xl md:text-8xl" role="img" aria-label="Vino">
          🍷
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 md:p-6">
        {/* Wine Name and Rating */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg sm:text-xl font-semibold text-black flex-1 pr-2">
            {name}
          </h3>
          <div className="bg-black text-white px-2 sm:px-3 py-1 rounded-lg font-semibold text-xs sm:text-sm flex items-center gap-1 flex-shrink-0">
            <span aria-hidden="true">⭐</span>
            <span>{rating}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-black mb-4 sm:mb-5 md:mb-6">
          <span className="text-base sm:text-lg flex-shrink-0">{countryFlag}</span>
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs sm:text-sm truncate">{region}, {country}</span>
        </div>

        {/* Lote Info */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
          <div>
            <div className="text-xs text-black mb-1">Total Botellas</div>
            <div className="text-xl sm:text-2xl font-bold text-black">{total}</div>
          </div>
          <div>
            <div className="text-xs text-black mb-1">Estado</div>
            <div className="text-xl sm:text-2xl font-bold text-black flex items-center gap-1">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              Certificado
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-black">Disponibles</span>
            <span className="font-semibold text-black">
              {available} / {total} unidades
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-black h-full rounded-full transition-all duration-500"
              style={{ width: `${availabilityPercentage}%` }}
              role="progressbar"
              aria-valuenow={available}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${available} de ${total} unidades disponibles`}
            />
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href={`/lotes/${id}`}
          className="block w-full bg-black text-white text-center py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          aria-label={`Ver trazabilidad de ${name}`}
        >
          Ver Trazabilidad
        </Link>
      </div>
    </motion.div>
  );
}
