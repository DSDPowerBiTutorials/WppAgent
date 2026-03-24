"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  HelpCircle,
  ShieldCheck,
  CalendarCheck,
  UserX,
  CreditCard,
  FolderHeart,
  Stethoscope,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: HelpCircle,
    title: "Dúvidas",
    description:
      "Tire dúvidas comuns a qualquer hora e alivie a carga de trabalho da sua recepção",
    detail:
      "O agente IA responde automaticamente perguntas frequentes sobre horários, localização, convênios aceitos, preparos para exames e muito mais. Base de conhecimento personalizável por clínica.",
  },
  {
    icon: ShieldCheck,
    title: "Eligibilidade",
    description:
      "IA checa elegibilidade dos seus pacientes sem tomar tempo da sua recepção",
    detail:
      "Verificação automática de convênios, planos e coberturas. Integração com operadoras para validação em tempo real.",
  },
  {
    icon: CalendarCheck,
    title: "Agendamento",
    description: "IA agenda toda conversa automaticamente sem intervenção humana",
    detail:
      "Agendamento inteligente com verificação de disponibilidade, sugestão de horários alternativos e confirmação automática. Integra com calendários existentes.",
  },
  {
    icon: UserX,
    title: "Gestão de Faltas",
    description:
      "IA cancela, reagenda e confirma automaticamente, reduzindo faltas",
    detail:
      "Sistema de confirmação proativa via WhatsApp. Lembretes automáticos 24h e 1h antes da consulta. Reagendamento instantâneo em caso de cancelamento.",
  },
  {
    icon: CreditCard,
    title: "Pagamentos",
    description:
      "Automatize cobranças, confirmações e controle de pagamentos de pacientes",
    detail:
      "Envio automático de links de pagamento, confirmação de recebimento e lembretes de pendências. Integração com gateways de pagamento.",
  },
  {
    icon: FolderHeart,
    title: "Gestão de Casos",
    description:
      "Acompanhe automaticamente e continuamente seus pacientes, sem esforço",
    detail:
      "Follow-up automático pós-consulta, pesquisas de satisfação, lembretes de retorno e acompanhamento de tratamentos contínuos.",
  },
  {
    icon: Stethoscope,
    title: "Pré e Pós Operatório",
    description:
      "Automatize instruções, lembretes e acompanhamento para cirurgias",
    detail:
      "Envio automatizado de instruções pré e pós-operatórias, checklist de preparo, acompanhamento de recuperação e alertas personalizados.",
  },
  {
    icon: BarChart3,
    title: "Inteligência Administrativa",
    description:
      "Configure e controle sua IA, acesse suas estatísticas descritivas, preditivas e prescritivas",
    detail:
      "Dashboard completo com métricas de atendimento, tendências, horários de pico, motivos de cancelamento e recomendações para otimização.",
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={ref}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            IA que automatiza trabalhos repetitivos da sua recepção
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Sua recepção funcionando 24/7, sem fadiga e sem erro
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.button
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 transition-colors group-hover:bg-emerald-100">
                <feature.icon className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {feature.description}
              </p>
              {expanded === i && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600"
                >
                  {feature.detail}
                </motion.p>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
