"use client";

import { motion } from "framer-motion";
import { Wine, Plus, Eye, Calendar, MapPin } from "lucide-react";
import Link from "next/link";

const mockLotes = [
  {
    id: "demo",
    nombre: "Cabernet Sauvignon 2023",
    varietal: "Cabernet Sauvignon",
    año: 2023,
    cantidad: 500,
    region: "Valle de Colchagua, Chile",
    estado: "En producción",
    ultimoEvento: "Fermentación iniciada",
    fecha: "2024-11-15",
  },
  {
    id: "2",
    nombre: "Malbec Reserva 2022",
    varietal: "Malbec",
    año: 2022,
    cantidad: 750,
    region: "Mendoza, Argentina",
    estado: "En guarda",
    ultimoEvento: "Embotellado completado",
    fecha: "2024-10-20",
  },
  {
    id: "3",
    nombre: "Carmenere Premium 2023",
    varietal: "Carmenere",
    año: 2023,
    cantidad: 300,
    region: "Valle del Maipo, Chile",
    estado: "En producción",
    ultimoEvento: "Cosecha completada",
    fecha: "2024-11-10",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
                Dashboard
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                Visualiza y gestiona todos tus lotes certificados con trazabilidad blockchain
              </p>
            </div>
            <Link
              href="/lotes/nuevo"
              className="inline-flex items-center gap-2 bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Nuevo Lote
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockLotes.map((lote, index) => (
              <motion.div
                key={lote.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="bg-white border-2 border-black rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Wine className="w-6 h-6 text-black" />
                        <h3 className="text-xl font-bold text-black">
                          {lote.nombre}
                        </h3>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {lote.estado}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {lote.region}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Año: {lote.año}
                      </div>
                      <div className="text-sm text-gray-600">
                        Cantidad: <span className="font-semibold text-black">{lote.cantidad} botellas</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Último evento</p>
                      <p className="text-sm font-semibold text-black">{lote.ultimoEvento}</p>
                      <p className="text-xs text-gray-500 mt-1">{lote.fecha}</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-black p-4 bg-gray-50">
                    <Link
                      href={`/lote/${lote.id}`}
                      className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors w-full text-sm sm:text-base"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Trazabilidad
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {mockLotes.length === 0 && (
            <div className="text-center py-12">
              <Wine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No tienes lotes registrados
              </h3>
              <p className="text-gray-500 mb-6">
                Comienza creando tu primer lote de vino
              </p>
              <Link
                href="/lotes/nuevo"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear Primer Lote
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
