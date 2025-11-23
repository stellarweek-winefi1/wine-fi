"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Wine, Calendar, MapPin, FileText, Plus, ExternalLink, QrCode, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  const { t } = useLanguage();
  const params = useParams();
  const [events, setEvents] = useState(mockEvents);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    evento: "",
    fecha: "",
    descripcion: "",
  });

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

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-black hover:text-gray-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t.loteDetail.backToDashboard}</span>
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
                        {mockLote.nombre}
                      </h1>
                      <p className="text-gray-600">{mockLote.varietal}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                    {mockLote.estado}
                  </span>
                </div>

                <p className="text-gray-700 mb-6">{mockLote.descripcion}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <div>
                      <p className="text-xs text-gray-500">{t.loteDetail.region}</p>
                      <p className="font-semibold text-black">{mockLote.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-5 h-5" />
                    <div>
                      <p className="text-xs text-gray-500">{t.loteDetail.year}</p>
                      <p className="font-semibold text-black">{mockLote.año}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Wine className="w-5 h-5" />
                    <div>
                      <p className="text-xs text-gray-500">{t.loteDetail.quantity}</p>
                      <p className="font-semibold text-black">{mockLote.cantidad} {t.loteDetail.bottles}</p>
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

              {/* Events Timeline */}
              <div className="bg-white border-2 border-black rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-black" />
                    <h2 className="text-xl font-bold text-black">Timeline de Eventos</h2>
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    {t.loteDetail.addEvent}
                  </button>
                </div>

                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-black rounded-full" />
                        {index < events.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-semibold text-black">{event.evento}</p>
                        <p className="text-sm text-gray-500 mb-1">{event.fecha}</p>
                        <p className="text-sm text-gray-700">{event.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </div>
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

      {/* Event Registration Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-black">{t.loteDetail.addEvent}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-black transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    {t.loteDetail.eventName}
                  </label>
                  <select
                    value={newEvent.evento}
                    onChange={(e) => setNewEvent({ ...newEvent, evento: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Cosecha">Cosecha</option>
                    <option value="Fermentación">Fermentación</option>
                    <option value="Embotellado">Embotellado</option>
                    <option value="Control de calidad">Control de calidad</option>
                    <option value="Almacenamiento">Almacenamiento</option>
                    <option value="Transporte">Transporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    {t.loteDetail.eventDate}
                  </label>
                  <input
                    type="date"
                    value={newEvent.fecha}
                    onChange={(e) => setNewEvent({ ...newEvent, fecha: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    {t.loteDetail.eventDescription}
                  </label>
                  <textarea
                    value={newEvent.descripcion}
                    onChange={(e) => setNewEvent({ ...newEvent, descripcion: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors resize-none"
                    placeholder="Describe los detalles del evento..."
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                  >
                    {t.loteDetail.add}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-white text-black px-4 py-3 rounded-lg font-semibold border-2 border-black hover:bg-gray-50 transition-colors"
                  >
                    {t.loteDetail.cancel}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
