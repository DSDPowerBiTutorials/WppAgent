"use client";

import { useState } from "react";
import { Search, Plus, Phone, Mail, MoreVertical, User } from "lucide-react";
import clsx from "clsx";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  birth_date: string;
  last_appointment: string | null;
  total_appointments: number;
  status: "active" | "inactive";
}

const mockPatients: Patient[] = [
  { id: "1", name: "Maria Silva", phone: "+55 11 99999-1234", email: "maria@email.com", cpf: "***.***.***-12", birth_date: "1985-03-15", last_appointment: "2025-01-15", total_appointments: 8, status: "active" },
  { id: "2", name: "João Santos", phone: "+55 11 98888-5678", email: "joao@email.com", cpf: "***.***.***-34", birth_date: "1990-07-22", last_appointment: "2025-01-10", total_appointments: 3, status: "active" },
  { id: "3", name: "Carla Mendes", phone: "+55 11 97777-9012", email: "carla@email.com", cpf: "***.***.***-56", birth_date: "1978-11-08", last_appointment: "2024-12-20", total_appointments: 12, status: "active" },
  { id: "4", name: "Roberto Almeida", phone: "+55 11 96666-3456", email: "roberto@email.com", cpf: "***.***.***-78", birth_date: "1995-01-30", last_appointment: null, total_appointments: 0, status: "inactive" },
  { id: "5", name: "Fernanda Costa", phone: "+55 11 95555-7890", email: "fernanda@email.com", cpf: "***.***.***-90", birth_date: "1982-09-17", last_appointment: "2025-01-18", total_appointments: 5, status: "active" },
  { id: "6", name: "André Barbosa", phone: "+55 11 94444-2345", email: "andre@email.com", cpf: "***.***.***-11", birth_date: "1988-06-04", last_appointment: "2025-01-12", total_appointments: 2, status: "active" },
  { id: "7", name: "Luciana Ferreira", phone: "+55 11 93333-6789", email: "luciana@email.com", cpf: "***.***.***-22", birth_date: "1973-12-25", last_appointment: "2024-11-05", total_appointments: 15, status: "inactive" },
];

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selected, setSelected] = useState<Patient | null>(null);

  const filtered = mockPatients.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.phone.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500">{mockPatients.length} pacientes cadastrados</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          <Plus size={16} />
          Novo Paciente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-300"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                statusFilter === s ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              {s === "all" ? "Todos" : s === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Table */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">Telefone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Consultas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => setSelected(patient)}
                    className={clsx(
                      "cursor-pointer transition-colors hover:bg-gray-50",
                      selected?.id === patient.id && "bg-emerald-50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                          {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{patient.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{patient.total_appointments}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        patient.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                      )}>
                        {patient.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="rounded p-1 text-gray-400 hover:bg-gray-100">
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">Nenhum paciente encontrado</div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          {selected ? (
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-lg font-semibold text-emerald-600">
                  {selected.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{selected.name}</h3>
                <span className={clsx(
                  "mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                  selected.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                )}>
                  {selected.status === "active" ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{selected.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{selected.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">CPF: {selected.cpf}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Nascimento</span>
                  <span className="text-gray-700">{new Date(selected.birth_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total consultas</span>
                  <span className="font-medium text-gray-700">{selected.total_appointments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Última consulta</span>
                  <span className="text-gray-700">
                    {selected.last_appointment
                      ? new Date(selected.last_appointment + "T12:00:00").toLocaleDateString("pt-BR")
                      : "—"}
                  </span>
                </div>
              </div>

              <button className="mt-6 w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Ver Histórico Completo
              </button>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white">
              <p className="text-sm text-gray-400">Selecione um paciente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
