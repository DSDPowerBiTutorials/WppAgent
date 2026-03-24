"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, CalendarPlus, Timer, UserCheck } from "lucide-react";

const stats = [
  {
    icon: Clock,
    value: 95,
    suffix: "%",
    label: "redução de tempo de espera",
    description:
      "Atendimento imediato, sem filas de espera aumenta a quantidade de agendamentos",
  },
  {
    icon: CalendarPlus,
    value: 40,
    suffix: "%",
    label: "aumento de agendamentos",
    description: "Mais pacientes atendidos sem aumentar sua recepção.",
  },
  {
    icon: Timer,
    value: 120,
    suffix: "h+",
    label: "tempo economizado por mês",
    description: "Em uma clínica com até 3 secretárias.",
  },
  {
    icon: UserCheck,
    value: 60,
    suffix: "%",
    label: "redução de faltas",
    description: "Garantia de agenda cheia com confirmações inteligentes.",
  },
];

function AnimatedCounter({
  target,
  suffix,
  inView,
}: {
  target: number;
  suffix: string;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span className="text-4xl font-bold text-gradient">
      {count}
      {suffix}
    </span>
  );
}

export function ResultsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="results" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={ref}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Resultados reais que transformam
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
                <stat.icon className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="mt-4">
                <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix}
                  inView={inView}
                />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {stat.label}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
