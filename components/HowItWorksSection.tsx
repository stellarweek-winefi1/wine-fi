"use client";

import Image from "next/image";
import { Shield, Clock, Zap, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const features = [
    {
      icon: Shield,
      title: t.howItWorks.features.reliable.title,
      description: t.howItWorks.features.reliable.description,
    },
    {
      icon: Clock,
      title: t.howItWorks.features.available.title,
      description: t.howItWorks.features.available.description,
    },
    {
      icon: Zap,
      title: t.howItWorks.features.fast.title,
      description: t.howItWorks.features.fast.description,
    },
    {
      icon: QrCode,
      title: t.howItWorks.features.smartQR.title,
      description: t.howItWorks.features.smartQR.description,
    },
  ];

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden"
      aria-labelledby="features-heading"
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-8 sm:mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            id="features-heading"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-black px-4"
          >
            {t.howItWorks.title}
          </h2>
          <motion.p
            className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto px-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t.howItWorks.subtitle}
          </motion.p>
        </motion.div>

        {/* Image Section */}
        <motion.div
          className="mb-12 sm:mb-16 grid grid-cols-1 md:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden border-2 border-black">
            <Image
              src="/assets/nik-f-KSl193viP48-unsplash.jpg"
              alt="Proceso de producción de vino"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden border-2 border-black">
            <Image
              src="/assets/sue-winston-bYvmOw-3kqE-unsplash.jpg"
              alt="Trazabilidad y certificación de vinos"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-black relative overflow-hidden group cursor-pointer"
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1]
                }}
                whileHover={{ 
                  y: -10,
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
                style={{ willChange: "transform" }}
              >
                {/* Hover gradient overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  initial={false}
                />

                {/* Icon with animation */}
                <motion.div
                  className="bg-black w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-5 sm:mb-6 relative z-10"
                  whileHover={{ 
                    scale: 1.15,
                    rotate: [0, -5, 5, -5, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white relative z-10" aria-hidden="true" />
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-xl"
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.5, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                </motion.div>

                <div className="relative z-10">
                  <motion.h3
                    className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-black"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {feature.title}
                  </motion.h3>
                  <motion.p
                    className="text-base sm:text-lg text-gray-700 leading-relaxed"
                    initial={{ opacity: 0.8 }}
                    whileHover={{ opacity: 1 }}
                  >
                    {feature.description}
                  </motion.p>
                </div>

                {/* Decorative corner on hover */}
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ scale: 0, rotate: -90 }}
                  whileHover={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
