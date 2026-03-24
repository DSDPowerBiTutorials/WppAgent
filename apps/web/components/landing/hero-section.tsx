"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const rotatingWords = ["agenda", "confirma", "reagenda", "responde", "cobra"];

function WhatsAppMockChat() {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
      {/* Chat header */}
      <div className="flex items-center gap-3 bg-emerald-600 px-4 py-3">
        <div className="h-10 w-10 rounded-full bg-emerald-500" />
        <div>
          <p className="text-sm font-semibold text-white">Clínica Saúde+</p>
          <p className="text-xs text-emerald-200">online · IA do WppAgent</p>
        </div>
      </div>
      {/* Messages */}
      <div className="space-y-3 bg-[#efeae2] p-4">
        <ChatBubble side="left" delay={0.3}>
          Olá! Gostaria de agendar uma consulta?
        </ChatBubble>
        <ChatBubble side="right" delay={1}>
          Sim, por favor!
        </ChatBubble>
        <ChatBubble side="left" delay={1.8}>
          Perfeito! Que tal amanhã às 10h com Dr. Paulo (Cardiologia)?
        </ChatBubble>
        <ChatBubble side="right" delay={2.8}>
          Perfeito! Confirmo. ✅
        </ChatBubble>
        <ChatBubble side="left" delay={3.5}>
          Consulta confirmada! Enviarei um lembrete amanhã. 😊
        </ChatBubble>
      </div>
    </div>
  );
}

function ChatBubble({
  children,
  side,
  delay,
}: {
  children: React.ReactNode;
  side: "left" | "right";
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          side === "right"
            ? "bg-emerald-100 text-gray-800"
            : "bg-white text-gray-800 shadow-sm"
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-blue-100/30 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left—text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                IA que atende pacientes 24/7,
                <br />
                <span className="text-gradient">
                  {rotatingWords[wordIndex]}
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-gray-600">
                Sua recepção funcionando 24/7, sem fadiga e sem erro. Pare de
                perder ligações e responda mensagens de pacientes imediatamente
                com atendimento de primeira classe.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="https://wa.me/5511999999999?text=Oi!%20Quero%20saber%20mais%20sobre%20o%20WppAgent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:opacity-90 hover:shadow-xl"
                >
                  Fale com vendas
                </a>
                <a
                  href="#demo"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Ver demo
                </a>
              </div>
            </motion.div>
          </div>

          {/* Right—WhatsApp mock */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <WhatsAppMockChat />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
