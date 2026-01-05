"use client";

import { motion } from "framer-motion";
import { Wallet, Trophy, Compass, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { useTranslation } from '@/hooks/useLanguage';

export function HowItWorks({ darkMode }) {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Wallet,
      title: t('landing.howItWorks.step1.title'),
      description: t('landing.howItWorks.step1.description'),
      accent: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      icon: Compass,
      title: t('landing.howItWorks.step2.title'),
      description: t('landing.howItWorks.step2.description'),
      accent: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20"
    },
    {
      icon: Trophy,
      title: t('landing.howItWorks.step3.title'),
      description: t('landing.howItWorks.step3.description'),
      accent: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20"
    }
  ];

  return (
    <section id="how-it-works" className="relative z-10 py-24 px-4 bg-black/20 border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: Text Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-mono tracking-wider uppercase">
              {t('landing.howItWorks.simpleOnboarding')}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              {t('landing.howItWorks.titlePart1')} <br />
              <span className="text-primary">{t('landing.howItWorks.titlePart2')}</span>
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
              {t('landing.howItWorks.subtitle')}
            </p>

            <div className="space-y-4 pt-4">
              {[
                t('landing.howItWorks.checklist1'),
                t('landing.howItWorks.checklist2'),
                t('landing.howItWorks.checklist3')
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Vertical Process UI */}
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent dashed-line" />

            <div className="space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative pl-20"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  {/* Number Node */}
                  <div className={`absolute left-0 top-0 w-16 h-16 rounded-2xl flex items-center justify-center border ${step.border} ${step.bg} shadow-lg backdrop-blur-md z-10 group hover:scale-105 transition-transform`}>
                    <step.icon className={`w-7 h-7 ${step.accent}`} />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{step.title}</h3>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
