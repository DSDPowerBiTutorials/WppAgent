"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const integrations = [
  { name: "iClinic", color: "bg-blue-100" },
  { name: "Feegow", color: "bg-green-100" },
  { name: "Clinicorp", color: "bg-purple-100" },
  { name: "Clínica nas Nuvens", color: "bg-sky-100" },
  { name: "Stenci", color: "bg-orange-100" },
];

export function IntegrationsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="integrations" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={ref}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Integrações com principais prontuários
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Conecte-se facilmente com os principais sistemas de gestão de
            clínicas e hospitais do mercado brasileiro.
          </p>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          {integrations.map((integration, i) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`flex h-20 w-40 items-center justify-center rounded-xl ${integration.color} p-4 shadow-sm`}
            >
              <span className="text-sm font-semibold text-gray-700">
                {integration.name}
              </span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex h-20 w-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-4"
          >
            <span className="text-sm font-bold text-gray-400">10+</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
