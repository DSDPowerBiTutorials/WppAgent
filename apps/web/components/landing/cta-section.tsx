"use client";

import { motion } from "framer-motion";

export function CtaSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-gradient-primary p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Pronto para transformar seu atendimento?
          </h2>
          <p className="mt-4 text-lg text-emerald-100">
            Junte-se às clínicas e hospitais que já estão otimizando suas
            agendas com IA
          </p>
          <div className="mt-8">
            <a
              href="https://wa.me/5511999999999?text=Oi!%20Quero%20saber%20mais%20sobre%20o%20WppAgent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition-all hover:bg-emerald-50 hover:shadow-xl"
            >
              Fale com vendas
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
