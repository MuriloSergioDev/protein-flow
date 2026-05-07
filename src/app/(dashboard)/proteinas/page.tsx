"use client";

import { useState, useEffect, useRef } from "react";
import { FlaskConical } from "lucide-react";
import { useT } from "@/components/LocaleProvider";
import { useToast } from "@/components/Toast";

type Protein = {
  id: string;
  name: string;
  description: string | null;
};

export default function ProteinasPage() {
  const t = useT();
  const toast = useToast();
  const [proteins, setProteins] = useState<Protein[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch("/api/proteins")
      .then((r) => r.json())
      .then((data) => { setProteins(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function scrollToItem(id: string) {
    setHighlightId(id);
    setTimeout(() => {
      itemRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
    setTimeout(() => setHighlightId(null), 2000);
  }

  function openCreate() {
    setEditingId(null);
    setName("");
    setDescription("");
    setError(null);
    setShowForm(true);
  }

  function openEdit(p: Protein) {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description ?? "");
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setDescription("");
    setError(null);
  }

  async function handleSave() {
    if (!name.trim()) { setError(t.proteins.nameRequired); return; }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const res = await fetch(`/api/proteins/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
        });
        const updated: Protein = await res.json();
        setProteins((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        closeForm();
        toast.success(t.proteins.toastUpdated);
        scrollToItem(updated.id);
      } else {
        const res = await fetch("/api/proteins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
        });
        const created: Protein = await res.json();
        setProteins((prev) => [...prev, created]);
        closeForm();
        toast.success(t.proteins.toastCreated);
        scrollToItem(created.id);
      }
    } catch {
      setError(t.proteins.saveError);
      toast.error(t.proteins.toastError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch("/api/proteins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setProteins((prev) => prev.filter((p) => p.id !== id));
      toast.success(t.proteins.toastDeleted);
    } catch {
      toast.error(t.proteins.toastError);
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t.proteins.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.proteins.subtitle}</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
        >
          {t.proteins.new}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 p-4">{t.common.loading}</div>
      ) : proteins.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-10 sm:p-12 text-center">
          <div className="flex justify-center mb-4"><FlaskConical className="w-10 h-10 text-gray-300 dark:text-gray-600" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{t.proteins.noProteins}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.proteins.noProteinsDesc}</p>
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {t.proteins.new}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {proteins.map((p) => (
            <div
              key={p.id}
              ref={(el) => { itemRefs.current[p.id] = el; }}
              className={[
                "rounded-xl border px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 transition-colors duration-500",
                highlightId === p.id
                  ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800",
              ].join(" ")}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{p.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(p)}
                  className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors"
                >
                  {t.common.edit}
                </button>
                <button
                  onClick={() => setDeleteId(p.id)}
                  className="border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors"
                >
                  {t.common.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full sm:max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
              {editingId ? t.proteins.editTitle : t.proteins.newTitle}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.proteins.name}</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder={t.proteins.namePlaceholder}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.proteins.description} <span className="text-gray-400 dark:text-gray-500 font-normal">({t.common.optional})</span>
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.proteins.descriptionPlaceholder}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={closeForm}
                className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm px-4 py-2 rounded-lg transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
              >
                {saving ? t.common.saving : t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full sm:max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{t.proteins.deleteTitle}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.common.noUndo}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm px-4 py-2 rounded-lg transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
