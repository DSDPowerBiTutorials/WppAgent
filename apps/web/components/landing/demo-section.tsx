"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export function DemoSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="demo" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Demo CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Dê para sua assistente suas próprias assistentes de IA
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Permita que seus pacientes obtenham respostas, resolvam problemas e
            tomem ações — a qualquer momento, em qualquer canal
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <a
              href="https://wa.me/5511999999999?text=Oi!%20Vim%20da%20landing%20page%20e%20queria%20testar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Demo WhatsApp
            </a>
          </div>
        </motion.div>

        {/* Voice Config */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-20"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Atenda mais pacientes e ganhe controle do seu tempo
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Defina exatamente como sua IA deve soar e agir. Ajuste o tom de
              voz, velocidade e sotaque para alinhar com a identidade da sua
              clínica.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-md rounded-2xl bg-white p-8 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              Configurações de Voz
            </h3>

            <div className="mt-6 space-y-6">
              <VoiceSlider
                label="Tom de voz"
                leftLabel="SUAVE"
                rightLabel="ENERGÉTICO"
                defaultValue={40}
              />
              <VoiceSlider
                label="Velocidade da fala"
                leftLabel="DEVAGAR"
                rightLabel="RÁPIDO"
                defaultValue={55}
              />
              <VoiceSlider
                label="Sotaque (Neutro BR)"
                leftLabel="LOCAL"
                rightLabel="NEUTRO"
                defaultValue={70}
              />
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full bg-emerald-200 ring-2 ring-white" />
                <div className="h-8 w-8 rounded-full bg-blue-200 ring-2 ring-white" />
              </div>
              <span className="text-xs text-gray-500">
                Aplicado automaticamente aos agentes de IA da sua clínica.
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function VoiceSlider({
  label,
  leftLabel,
  rightLabel,
  defaultValue,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  defaultValue: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">{leftLabel}</span>
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-medium text-gray-400">{rightLabel}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        defaultValue={defaultValue}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-emerald-500"
      />
    </div>
  );
}
