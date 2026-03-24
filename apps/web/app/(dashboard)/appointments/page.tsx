"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";

type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed";

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  specialty: string;
  doctor: string;
  date: string;
  time: string;
  status: AppointmentStatus;
}

const statusConfig: Record<
  AppointmentStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  confirmed: { label: "Confirmado", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
  pending: { label: "Pendente", color: "text-amber-600 bg-amber-50", icon: AlertCircle },
  cancelled: { label: "Cancelado", color: "text-red-600 bg-red-50", icon: XCircle },
  completed: { label: "Realizado", color: "text-blue-600 bg-blue-50", icon: CheckCircle2 },
};

const mockAppointments: Appointment[] = [
  { id: "1", patient_name: "Maria Silva", patient_phone: "+55 11 99999-1234", specialty: "Cardiologia", doctor: "Dr. Ricardo Souza", date: "2025-01-20", time: "09:00", status: "confirmed" },
  { id: "2", patient_name: "João Santos", patient_phone: "+55 11 98888-5678", specialty: "Dermatologia", doctor: "Dra. Ana Oliveira", date: "2025-01-20", time: "09:30", status: "pending" },
  { id: "3", patient_name: "Carla Mendes", patient_phone: "+55 11 97777-9012", specialty: "Ortopedia", doctor: "Dr. Pedro Lima", date: "2025-01-20", time: "10:00", status: "confirmed" },
  { id: "4", patient_name: "Roberto Almeida", patient_phone: "+55 11 96666-3456", specialty: "Cardiologia", doctor: "Dr. Ricardo Souza", date: "2025-01-20", time: "10:30", status: "cancelled" },
  { id: "5", patient_name: "Fernanda Costa", patient_phone: "+55 11 95555-7890", specialty: "Pediatria", doctor: "Dra. Juliana Reis", date: "2025-01-20", time: "11:00", status: "completed" },
  { id: "6", patient_name: "André Barbosa", patient_phone: "+55 11 94444-2345", specialty: "Neurologia", doctor: "Dr. Marcos Pereira", date: "2025-01-21", time: "08:30", status: "pending" },
  { id: "7", patient_name: "Luciana Ferreira", patient_phone: "+55 11 93333-6789", specialty: "Dermatologia", doctor: "Dra. Ana Oliveira", date: "2025-01-21", time: "14:00", status: "confirmed" },
];

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function MiniCalendar({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const [viewDate, setViewDate] = useState(new Date(selected || "2025-01-20"));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = () => setViewDate(new Date(year, month - 1, 1));
  const next = () => setViewDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 rounded hover:bg-gray-100">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-gray-900">{MONTHS[month]} {year}</span>
        <button onClick={next} className="p-1 rounded hover:bg-gray-100">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAYS.map((d) => (
          <div key={d} className="text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasAppt = mockAppointments.some((a) => a.date === dateStr);
          const isSelected = dateStr === selected;
          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={clsx(
                "relative rounded-lg py-1 text-sm transition-colors",
                isSelected ? "bg-emerald-600 text-white font-semibold" : "hover:bg-gray-100 text-gray-700",
              )}
            >
              {day}
              {hasAppt && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState("2025-01-20");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");

  const filtered = mockAppointments.filter((a) => {
    if (a.date !== selectedDate) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
        <p className="text-sm text-gray-500">Gerencie consultas e confirmações</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Calendar sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <MiniCalendar selected={selectedDate} onSelect={setSelectedDate} />
          </div>

          {/* Summary */}
          <div className="mt-4 space-y-2">
            {(Object.entries(statusConfig) as [AppointmentStatus, typeof statusConfig[AppointmentStatus]][]).map(([key, cfg]) => {
              const count = mockAppointments.filter((a) => a.date === selectedDate && a.status === key).length;
              return (
                <div key={key} className="flex items-center justify-between rounded-lg bg-white p-3 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <cfg.icon size={14} className={cfg.color.split(" ")[0]} />
                    <span className="text-sm text-gray-600">{cfg.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointments list */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            {/* Filters */}
            <div className="flex items-center gap-2 border-b border-gray-100 p-4">
              <CalendarIcon size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              <div className="ml-auto flex gap-1">
                {(["all", "confirmed", "pending", "cancelled", "completed"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={clsx(
                      "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                      statusFilter === s ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {s === "all" ? "Todos" : statusConfig[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">Nenhum agendamento encontrado</div>
              ) : (
                filtered.map((appt) => {
                  const cfg = statusConfig[appt.status];
                  return (
                    <div key={appt.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-gray-50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <Clock size={18} className="text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{appt.time}</span>
                          <span className="text-sm text-gray-600">— {appt.patient_name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{appt.specialty}</span>
                          <span>•</span>
                          <span>{appt.doctor}</span>
                          <span>•</span>
                          <span>{appt.patient_phone}</span>
                        </div>
                      </div>
                      <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", cfg.color)}>
                        <cfg.icon size={12} />
                        {cfg.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
