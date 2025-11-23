"use client";

import Image from "next/image";
import { Wine, Shield, Globe, TrendingUp, FileCheck, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WhyInvestSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const benefits = [
    {
      icon: Shield,
      title: t.whyInvest.benefits.brandProtection.title,
      description: t.whyInvest.benefits.brandProtection.description,
    },
    {
      icon: FileCheck,
      title: t.whyInvest.benefits.autoCertification.title,
      description: t.whyInvest.benefits.autoCertification.description,
    },
    {
      icon: Users,
      title: t.whyInvest.benefits.customerTrust.title,
      description: t.whyInvest.benefits.customerTrust.description,
    },
    {
      icon: TrendingUp,
      title: t.whyInvest.benefits.exportSupport.title,
      description: t.whyInvest.benefits.exportSupport.description,
    },
    {
      icon: Globe,
      title: t.whyInvest.benefits.problemDetection.title,
      description: t.whyInvest.benefits.problemDetection.description,
    },
    {
      icon: Wine,
      title: t.whyInvest.benefits.easyToUse.title,
      description: t.whyInvest.benefits.easyToUse.description,
    },
  ];

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden"
      aria-labelledby="value-heading"
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
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4 px-4"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Wine className="w-8 h-8 sm:w-10 sm:h-10 text-black" aria-hidden="true" />
            </motion.div>
            <h2
              id="value-heading"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black text-center"
            >
              {t.whyInvest.title}
            </h2>
          </motion.div>
          <motion.p
            className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto px-4 mt-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {t.whyInvest.subtitle}
          </motion.p>
        </motion.div>

        {/* Image Section */}
        <motion.div
          className="mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden border-2 border-black">
            <Image
              src="/assets/nathan-blackaby-TLccRhX4iD4-unsplash.jpg"
              alt="Viñedo y producción de vino"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-black relative overflow-hidden group cursor-pointer"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1]
                }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
              >
                {/* Hover background effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                
                {/* Animated icon container */}
                <motion.div
                  className="bg-black w-14 h-14 rounded-xl flex items-center justify-center mb-5 relative z-10"
                  whileHover={{ 
                    scale: 1.1,
                    rotate: 5,
                    transition: { duration: 0.3 }
                  }}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeInOut"
                    }}
                  >
                    <Icon className="w-7 h-7 text-white" aria-hidden="true" />
                  </motion.div>
                </motion.div>
                
                <div className="relative z-10">
                  <motion.h3
                    className="text-xl font-semibold mb-3 text-black"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {benefit.title}
                  </motion.h3>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                {/* Decorative corner */}
                <motion.div
                  className="absolute bottom-0 right-0 w-24 h-24 bg-black/5 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
