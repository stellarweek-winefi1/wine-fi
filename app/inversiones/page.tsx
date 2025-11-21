"use client";

import { DollarSign, Wine, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import InvestmentCard from "@/components/InvestmentCard";
import {
  getUserInvestments,
  getInvestmentSummary,
} from "@/lib/getUserInvestments";

export default function InversionesPage() {
  const investments = getUserInvestments();
  const summary = getInvestmentSummary(investments);

  return (
    <main className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-black px-4">
            Mis Inversiones
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-black max-w-3xl mx-auto px-4">
            Gestiona y sigue el rendimiento de tus inversiones en vinos premium
          </p>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8 md:mb-12">
          {/* Total Invested */}
          <motion.div
            className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-black flex flex-col h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="bg-black w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-600">
                Total Invertido
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-black">
              ${summary.totalInvested.toLocaleString()}
            </div>
          </motion.div>

          {/* Current Value */}
          <motion.div
            className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-black flex flex-col h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-black w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Valor Actual
              </span>
            </div>
            <div className="text-2xl font-bold text-black">
              ${summary.totalCurrentValue.toLocaleString()}
            </div>
          </motion.div>

          {/* Total Return */}
          <motion.div
            className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-black flex flex-col h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-black w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Retorno Total
              </span>
            </div>
            <div className="flex flex-col">
              <div
                className={`text-2xl font-bold mb-1 ${
                  summary.totalReturnPercentage >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {summary.totalReturnPercentage >= 0 ? "+" : ""}
                {summary.totalReturnPercentage.toFixed(1)}%
              </div>
              <div
                className={`text-sm ${
                  summary.totalReturn >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {summary.totalReturn >= 0 ? "+" : ""}
                ${summary.totalReturn.toLocaleString()}
              </div>
            </div>
          </motion.div>

          {/* Wine Count */}
          <motion.div
            className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-black flex flex-col h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-black w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wine className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                Cantidad de Vinos
              </span>
            </div>
            <div className="flex flex-col">
              <div className="text-2xl font-bold text-black mb-1">
                {summary.wineCount}
              </div>
              <div className="text-sm text-gray-600">
                Promedio: ${summary.averageValuePerWine.toLocaleString()}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Investments List */}
        {investments.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-black">
                Tus Inversiones ({investments.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {investments.map((investment) => (
                <InvestmentCard key={investment.id} investment={investment} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍷</div>
            <h3 className="text-2xl font-semibold text-black mb-2">
              Aún no tienes inversiones
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza a invertir en vinos premium y construye tu portafolio
            </p>
            <Link
              href="/mercado"
              className="inline-block bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Explorar Vinos Disponibles
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

