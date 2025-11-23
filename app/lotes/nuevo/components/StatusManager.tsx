"use client";

import { useState } from "react";
import { Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateLotStatus, LotStatus } from "@/lib/wine-tokens";
import { cn } from "@/lib/utils";

interface StatusManagerProps {
  tokenAddress: string;
  currentStatus?: string | null;
  onStatusUpdated?: (event: any) => void;
  onClose?: () => void;
}

const STATUS_OPTIONS: { value: LotStatus; label: string; description: string }[] = [
  { value: "harvested", label: "Cosechado", description: "Las uvas han sido cosechadas" },
  { value: "fermented", label: "Fermentado", description: "Proceso de fermentación completado" },
  { value: "aged", label: "Añejado", description: "Vino en proceso de añejamiento" },
  { value: "bottled", label: "Embotellado", description: "Vino embotellado y listo" },
  { value: "shipped", label: "Enviado", description: "Vino enviado a destino" },
  { value: "available", label: "Disponible", description: "Vino disponible para venta" },
  { value: "sold_out", label: "Agotado", description: "Lote completamente vendido" },
  { value: "recalled", label: "Retirado", description: "Lote retirado del mercado" },
];

export default function StatusManager({
  tokenAddress,
  currentStatus,
  onStatusUpdated,
  onClose,
}: StatusManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<LotStatus | "">("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStatus) {
      setError("Por favor selecciona un estado");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateLotStatus(tokenAddress, selectedStatus as LotStatus, {
        location: location || undefined,
        notes: notes || undefined,
        useTokenAddress: true, // Indicate we're using token_address
      });

      if (result.success && result.event) {
        setSuccess(true);
        setTransactionHash(result.event.transaction_hash || null);
        
        // Call callback after a short delay to show success message
        setTimeout(() => {
          if (onStatusUpdated) {
            onStatusUpdated(result.event);
          }
          if (onClose) {
            onClose();
          }
        }, 2000);
      } else {
        setError(result.error || "Error al actualizar el estado");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {currentStatus && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Estado actual:</p>
          <p className="font-semibold text-black capitalize">
            {STATUS_OPTIONS.find(s => s.value === currentStatus)?.label || currentStatus}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Nuevo Estado <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as LotStatus)}
            required
            disabled={isSubmitting}
            className={cn(
              "w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors",
              "border-gray-300 focus:border-black",
              isSubmitting && "bg-gray-100 cursor-not-allowed"
            )}
          >
            <option value="">Seleccionar estado...</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Ubicación (opcional)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ej: Bodega Principal, Mendoza"
            className={cn(
              "w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors",
              "border-gray-300 focus:border-black",
              isSubmitting && "bg-gray-100 cursor-not-allowed"
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            rows={3}
            placeholder="Información adicional sobre el cambio de estado..."
            className={cn(
              "w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors resize-none",
              "border-gray-300 focus:border-black",
              isSubmitting && "bg-gray-100 cursor-not-allowed"
            )}
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 mb-1">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-1">¡Estado actualizado!</p>
                <p className="text-sm text-green-700">
                  El estado ha sido actualizado en la base de datos y en la blockchain.
                </p>
                {transactionHash && (
                  <p className="text-xs text-green-600 mt-2 font-mono break-all">
                    TX: {transactionHash}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !selectedStatus}
            className={cn(
              "flex-1 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2",
              isSubmitting || !selectedStatus
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Actualizar Estado"
            )}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 text-black hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
