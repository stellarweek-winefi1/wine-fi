"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Wine, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NuevoLotePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: "",
    varietal: "",
    año: "",
    cantidad: "",
    region: "",
  });
  const [fileName, setFileName] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => {
      router.push("/lote/demo");
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="bg-green-100 rounded-full p-6 inline-flex mb-6">
            <Check className="w-16 h-16 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-black mb-2">
            Lote Creado Exitosamente
          </h2>
          <p className="text-gray-600">
            Redirigiendo a los detalles del lote...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-black hover:text-gray-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al Dashboard</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Wine className="w-8 h-8 text-black" />
            <div>
              <h1 className="text-3xl font-bold text-black">Nuevo Lote</h1>
              <p className="text-gray-600">Registra un nuevo lote de vino</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border-2 border-black rounded-xl shadow-lg p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-semibold text-black mb-2">
                  Nombre del Lote <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
                  placeholder="ej. Cabernet Sauvignon 2023"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="varietal" className="block text-sm font-semibold text-black mb-2">
                    Varietal <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="varietal"
                    name="varietal"
                    value={formData.varietal}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Cabernet Sauvignon">Cabernet Sauvignon</option>
                    <option value="Malbec">Malbec</option>
                    <option value="Carmenere">Carmenere</option>
                    <option value="Merlot">Merlot</option>
                    <option value="Pinot Noir">Pinot Noir</option>
                    <option value="Chardonnay">Chardonnay</option>
                    <option value="Sauvignon Blanc">Sauvignon Blanc</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="año" className="block text-sm font-semibold text-black mb-2">
                    Año <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="año"
                    name="año"
                    value={formData.año}
                    onChange={handleInputChange}
                    required
                    min="2000"
                    max="2025"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
                    placeholder="2023"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cantidad" className="block text-sm font-semibold text-black mb-2">
                  Cantidad (botellas) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="cantidad"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
                  placeholder="500"
                />
              </div>

              <div>
                <label htmlFor="region" className="block text-sm font-semibold text-black mb-2">
                  Región <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors"
                  placeholder="ej. Valle de Colchagua, Chile"
                />
              </div>

              <div>
                <label htmlFor="documento" className="block text-sm font-semibold text-black mb-2">
                  Documentos (opcional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-black transition-colors">
                  <input
                    type="file"
                    id="documento"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor="documento"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    {fileName ? (
                      <p className="text-sm text-black font-semibold">{fileName}</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mb-1">
                          Click para subir archivos
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, JPG, PNG (máx. 10MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="flex-1 bg-black text-white px-6 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
              >
                Crear Lote
              </button>
              <Link
                href="/dashboard"
                className="flex-1 bg-white text-black px-6 py-4 rounded-lg font-semibold border-2 border-black hover:bg-gray-50 transition-colors text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
