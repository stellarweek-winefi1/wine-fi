"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HeroSection() {
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);
  const { t } = useLanguage();

  return (
    <section
      className="relative bg-gradient-to-b from-gray-50 to-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
      aria-labelledby="hero-heading"
      ref={constraintsRef}
    >
      {/* Background Image */}
      <div className="absolute inset-0 opacity-10">
        <Image
          src="/assets/gabriel-santos--RsUaWZtAhY-unsplash.jpg"
          alt="Viñedo"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.h1
          id="hero-heading"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 text-black leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {t.hero.title}
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-3 sm:mb-4 max-w-4xl mx-auto px-4 font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto px-4 leading-relaxed space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <p>
            {t.hero.description1}
          </p>
          <p>
            {t.hero.description2}
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 md:mb-20 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/lotes"
              className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg shadow-lg hover:shadow-2xl w-full sm:w-auto transition-all duration-300 group relative overflow-hidden"
              aria-label={t.hero.viewLots}
            >
              <span className="relative z-10 flex items-center gap-2">
                {t.hero.viewLots}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
              <motion.span
                className="absolute inset-0 bg-gray-800"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/lotes/nuevo"
              className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg border-2 border-black hover:border-gray-600 w-full sm:w-auto transition-all duration-300 group relative overflow-hidden"
              aria-label={t.hero.registerNewLot}
            >
              <span className="relative z-10">{t.hero.registerNewLot}</span>
              <motion.span
                className="absolute inset-0 bg-gray-50"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/buy"
              className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg border-2 border-black hover:border-gray-600 w-full sm:w-auto transition-all duration-300 group relative overflow-hidden"
              aria-label={t.hero.buyLots}
            >
              <span className="relative z-10">{t.hero.buyLots}</span>
              <motion.span
                className="absolute inset-0 bg-gray-50"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats Section with hover effects */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-6xl mx-auto px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {[
            { value: "100%", label: t.hero.stats.reliable },
            { value: "24/7", label: t.hero.stats.available },
            { value: t.hero.stats.process, label: t.hero.stats.inMinutes },
            { value: "QR", label: t.hero.stats.smart },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-md border border-black cursor-default relative overflow-hidden group"
              whileHover={{ 
                scale: 1.05,
                y: -5,
                transition: { duration: 0.3 }
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
              <div className="relative z-10">
                <motion.div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-1 sm:mb-2"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-black text-xs sm:text-sm">
                  {stat.label || (
                    <>
                      <span className="block">{stat.value}</span>
                      <span className="block">{stat.sublabel}</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
