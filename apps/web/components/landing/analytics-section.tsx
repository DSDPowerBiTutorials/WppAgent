"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle, DollarSign, Clock } from "lucide-react";

const specialties = [
  { name: "Cardiologia", count: 245, percentage: 25 },
  { name: "Ortopedia", count: 198, percentage: 20 },
  { name: "Dermatologia", count: 156, percentage: 16 },
  { name: "Ginecologia", count: 134, percentage: 14 },
  { name: "Pediatria", count: 112, percentage: 11 },
];

export function AnalyticsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="analytics" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={ref}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Análise preditiva e insights
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Transforme conversas em dados, e resultados. Identifique gargalos,
            horários de pico, motivos de cancelamento, e demanda por novas
            especialidades.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Specialties */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="col-span-1 rounded-2xl bg-white p-6 shadow-sm lg:col-span-2"
          >
            <h3 className="text-sm font-semibold text-gray-500">
              Especialidade Procurada
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              Especialidade médica que o paciente está buscando na clínica
            </p>
            <div className="mt-6 space-y-4">
              {specialties.map((s) => (
                <div key={s.name} className="flex items-center gap-4">
                  <span className="w-28 text-sm font-medium text-gray-700">
                    {s.name}
                  </span>
                  <div className="flex-1">
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${s.percentage * 3}%` } : {}}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full rounded-full bg-gradient-primary"
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {s.count}
                  </span>
                  <span className="text-xs text-gray-400">{s.percentage}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Side stats */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Consulta Confirmada</p>
                  <p className="text-2xl font-bold text-gray-900">295</p>
                  <p className="text-xs text-gray-400">30% dos agendamentos</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Receita Incremental</p>
                  <p className="text-2xl font-bold text-gray-900">R$ 55.000</p>
                  <p className="text-xs text-gray-400">
                    Receita de agendamentos
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tempo Economizado</p>
                  <p className="text-2xl font-bold text-gray-900">14h</p>
                  <p className="text-xs text-gray-400">Neste mês</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
