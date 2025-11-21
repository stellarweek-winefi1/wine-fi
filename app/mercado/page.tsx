"use client";

import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import WineCard from "@/components/WineCard";

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
  },
];

export default function MercadoPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedWines, setDisplayedWines] = useState(wines);

  useEffect(() => {
    // Filter wines based on search query
    const filtered = wines.filter((wine) =>
      wine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wine.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wine.country.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setDisplayedWines(filtered);
  }, [searchQuery]);

  const filteredWines = displayedWines;

  return (
    <main className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-black px-4">
            Dashboard de Trazabilidad
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-black max-w-3xl mx-auto px-4">
            Visualiza todos los lotes certificados y su estado de trazabilidad en tiempo real
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 sm:mb-8 md:mb-12 px-4">
          <div className="relative max-w-2xl mx-auto">
            <label htmlFor="search-wines" className="sr-only">
              Buscar vinos por nombre, región o tipo
            </label>
            <Search
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-black"
              aria-hidden="true"
            />
            <input
              id="search-wines"
              type="search"
              placeholder="Buscar lotes por nombre, región o varietal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl border border-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base sm:text-lg"
              aria-label="Buscar vinos"
            />
          </div>
        </div>

        {/* Wine Grid */}
        {filteredWines.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {filteredWines.map((wine) => (
              <WineCard key={wine.id} {...wine} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-black mb-4">
              No se encontraron lotes que coincidan con tu búsqueda.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-black underline hover:text-gray-800"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}

        {/* Show count if there are wines */}
        {filteredWines.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Mostrando {filteredWines.length} {filteredWines.length === 1 ? "lote" : "lotes"} certificado{filteredWines.length === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
