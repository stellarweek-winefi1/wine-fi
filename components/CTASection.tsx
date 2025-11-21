"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 bg-black"
      aria-labelledby="cta-heading"
    >
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 id="cta-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Comienza Hoy
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto px-4">
            Únete a la revolución de la trazabilidad blockchain para vinos. Certifica lotes, registra eventos y garantiza autenticidad verificable.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center bg-white text-black px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto sm:min-w-[200px] md:min-w-[250px]"
              aria-label="Ver dashboard de trazabilidad"
            >
              Ver Dashboard
            </Link>

            <Link
              href="/lotes/nuevo"
              className="inline-flex items-center justify-center bg-white text-black px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg border-2 border-white hover:bg-gray-100 transition-colors w-full sm:w-auto sm:min-w-[200px] md:min-w-[250px]"
              aria-label="Registrar nuevo lote"
            >
              Registrar Lote
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
