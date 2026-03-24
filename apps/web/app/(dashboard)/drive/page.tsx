"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Search,
  File,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Trash2,
  Download,
  MoreVertical,
  Plus,
  Loader2,
  FolderOpen,
  Tag,
  Pencil,
  X,
  Check,
  HardDrive,
  Filter,
} from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

// ── Types ──────────────────────────────────────────────────────
interface DriveFile {
  id: string;
  organization_id: string;
  name: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  category: string;
  description: string | null;
  tags: string[];
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

// ── Constants ──────────────────────────────────────────────────
const CATEGORIES = [
  { key: "all", label: "Todos" },
  { key: "general", label: "Geral" },
  { key: "faq", label: "Base de Conhecimento" },
  { key: "protocols", label: "Protocolos" },
  { key: "templates", label: "Templates" },
  { key: "training", label: "Treinamento IA" },
  { key: "reports", label: "Relatórios" },
];

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon size={20} className="text-pink-500" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv")
    return <FileSpreadsheet size={20} className="text-emerald-500" />;
  if (mimeType === "application/pdf") return <FileText size={20} className="text-red-500" />;
  if (mimeType.startsWith("text/")) return <FileText size={20} className="text-blue-500" />;
  return <File size={20} className="text-gray-500" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-gray-100 text-gray-700",
  faq: "bg-blue-100 text-blue-700",
  protocols: "bg-violet-100 text-violet-700",
  templates: "bg-amber-100 text-amber-700",
  training: "bg-emerald-100 text-emerald-700",
  reports: "bg-rose-100 text-rose-700",
};

// ════════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════════
export default function DrivePage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", description: "" });
  const [uploadCategory, setUploadCategory] = useState("general");
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ── Fetch files ──
  const fetchFiles = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      const qs = params.toString();
      const res = await api.get<{ data: DriveFile[] }>(`/drive${qs ? `?${qs}` : ""}`);
      setFiles(res.data);
    } catch (err: any) {
      toast("error", err.message || "Erro ao carregar arquivos");
    } finally {
      setLoading(false);
    }
  }, [category, search, toast]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchFiles, 300);
    return () => clearTimeout(timeout);
  }, [fetchFiles]);

  // ── Upload ──
  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(fileList)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", uploadCategory);
        await api.upload<{ data: DriveFile }>("/drive/upload", formData);
        successCount++;
      } catch (err: any) {
        toast("error", `Erro ao enviar "${file.name}": ${err.message}`);
      }
    }

    if (successCount > 0) {
      toast("success", `${successCount} arquivo${successCount > 1 ? "s" : ""} enviado${successCount > 1 ? "s" : ""} com sucesso`);
      fetchFiles();
    }
    setUploading(false);
    setShowUploadPanel(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Drag & Drop ──
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  // ── Download ──
  const handleDownload = async (file: DriveFile) => {
    try {
      const res = await api.get<{ url: string }>(`/drive/${file.id}/download`);
      window.open(res.url, "_blank");
    } catch (err: any) {
      toast("error", "Erro ao gerar link de download");
    }
    setMenuOpen(null);
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/drive/${id}`);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast("success", "Arquivo excluído");
    } catch (err: any) {
      toast("error", err.message || "Erro ao excluir");
    }
    setDeleteConfirm(null);
    setMenuOpen(null);
  };

  // ── Edit metadata ──
  const startEdit = (file: DriveFile) => {
    setEditingFile(file.id);
    setEditForm({
      name: file.name,
      category: file.category,
      description: file.description || "",
    });
    setMenuOpen(null);
  };

  const saveEdit = async () => {
    if (!editingFile) return;
    try {
      const res = await api.patch<{ data: DriveFile }>(`/drive/${editingFile}`, editForm);
      setFiles((prev) => prev.map((f) => (f.id === editingFile ? res.data : f)));
      toast("success", "Arquivo atualizado");
    } catch (err: any) {
      toast("error", err.message || "Erro ao atualizar");
    }
    setEditingFile(null);
  };

  // ── Stats ──
  const totalSize = files.reduce((s, f) => s + f.size_bytes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <HardDrive size={20} className="text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">Drive</h1>
            </div>
            <p className="text-sm text-gray-500">
              Gerencie arquivos para uso do agente IA e da equipe
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowUploadPanel(!showUploadPanel)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Upload size={16} />
          Enviar Arquivo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Total de Arquivos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{files.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Espaço Utilizado</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{formatSize(totalSize)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Categorias</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {new Set(files.map((f) => f.category)).size}
          </p>
        </div>
      </div>

      {/* Upload panel */}
      {showUploadPanel && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={clsx(
            "rounded-xl border-2 border-dashed bg-white p-8 transition-colors",
            dragOver ? "border-emerald-400 bg-emerald-50/50" : "border-gray-200"
          )}
        >
          <div className="flex flex-col items-center gap-4">
            {uploading ? (
              <Loader2 size={32} className="animate-spin text-emerald-600" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Upload size={28} className="text-emerald-600" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {uploading ? "Enviando..." : "Arraste arquivos aqui ou clique para selecionar"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PDF, Word, Excel, CSV, TXT, Imagens — máx. 50 MB
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              >
                {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.json,.png,.jpg,.jpeg,.gif,.webp,.svg"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                Selecionar Arquivos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar arquivos..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-emerald-400"
          />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={clsx(
                "px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap",
                category === c.key
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* File list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FolderOpen size={32} className="text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Nenhum arquivo encontrado</p>
            <p className="mt-1 text-xs text-gray-500">
              Envie seu primeiro arquivo para começar
            </p>
          </div>
          <button
            onClick={() => setShowUploadPanel(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={16} />
            Enviar Arquivo
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Arquivo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tamanho</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Enviado em</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {files.map((file) => (
                <tr key={file.id} className="group transition-colors hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    {editingFile === file.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-emerald-400"
                        />
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Descrição..."
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-emerald-400"
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                            className="rounded border border-gray-200 px-2 py-1 text-xs outline-none"
                          >
                            {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                              <option key={c.key} value={c.key}>{c.label}</option>
                            ))}
                          </select>
                          <button onClick={saveEdit} className="rounded bg-emerald-100 p-1 text-emerald-600 hover:bg-emerald-200">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingFile(null)} className="rounded bg-gray-100 p-1 text-gray-500 hover:bg-gray-200">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                          {getFileIcon(file.mime_type)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="truncate text-xs text-gray-500">{file.original_name}</p>
                          {file.description && (
                            <p className="mt-0.5 truncate text-xs text-gray-400">{file.description}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium", CATEGORY_COLORS[file.category] || CATEGORY_COLORS.general)}>
                      {CATEGORIES.find((c) => c.key === file.category)?.label || file.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatSize(file.size_bytes)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(file.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === file.id ? null : file.id)}
                        className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpen === file.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                            <button
                              onClick={() => handleDownload(file)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Download size={14} /> Baixar
                            </button>
                            <button
                              onClick={() => startEdit(file)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil size={14} /> Editar
                            </button>
                            <hr className="my-1 border-gray-100" />
                            {deleteConfirm === file.id ? (
                              <div className="px-3 py-2">
                                <p className="text-xs text-red-600">Tem certeza?</p>
                                <div className="mt-1 flex gap-2">
                                  <button
                                    onClick={() => handleDelete(file.id)}
                                    className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                                  >
                                    Não
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(file.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} /> Excluir
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
