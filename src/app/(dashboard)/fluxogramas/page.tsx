"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import AnnotationNode from "@/components/flowchart/AnnotationNode";
import PhotoNode from "@/components/flowchart/PhotoNode";
import { GitBranch } from "lucide-react";
import { useT } from "@/components/LocaleProvider";

const nodeTypes = { annotation: AnnotationNode, photo: PhotoNode };

type Flowchart = {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  updatedAt: string;
};

// ─── Editor ──────────────────────────────────────────────────────────────────

function FlowchartEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Flowchart;
  onSave: (fc: Flowchart) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [name, setName] = useState(initial.name);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isNew = !initial.updatedAt;

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  function addNode(type: "annotation" | "photo") {
    const newNode: Node = {
      id: `${Date.now()}`,
      type,
      position: { x: 100 + Math.random() * 200, y: 100 + nodes.length * 120 },
      data: { label: type === "annotation" ? t.flowcharts.newAnnotationLabel : t.flowcharts.newPhotoLabel },
    };
    setNodes((nds) => [...nds, newNode]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = JSON.stringify({ name, nodes, edges });
      const res = isNew
        ? await fetch("/api/flowcharts", { method: "POST", headers: { "Content-Type": "application/json" }, body })
        : await fetch(`/api/flowcharts/${initial.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body });
      const fc: Flowchart = await res.json();
      onSave(fc);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] lg:h-screen">
      <div className="flex flex-wrap items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap"
          >
            {t.common.back}
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 shrink-0" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 flex-1 sm:flex-none sm:w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => addNode("annotation")}
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            {t.flowcharts.addAnnotation}
          </button>
          <button
            onClick={() => addNode("photo")}
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            {t.flowcharts.addPhoto}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {saved ? t.flowcharts.saved : saving ? t.common.saving : t.flowcharts.save}
          </button>
        </div>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

export default function FluxogramasPage() {
  const t = useT();
  const [flowcharts, setFlowcharts] = useState<Flowchart[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Flowchart | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/flowcharts")
      .then((r) => r.json())
      .then((data) => setFlowcharts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  function handleCreate() {
    setEditing({
      id: "",
      name: t.flowcharts.newFlowchartName,
      nodes: [
        {
          id: "1",
          type: "annotation",
          position: { x: 100, y: 100 },
          data: { label: t.flowcharts.defaultAnnotation },
        },
      ],
      edges: [],
      updatedAt: "",
    });
  }

  function handleSave(fc: Flowchart) {
    setFlowcharts((prev) => {
      const exists = prev.find((f) => f.id === fc.id);
      return exists ? prev.map((f) => (f.id === fc.id ? fc : f)) : [fc, ...prev];
    });
    setEditing(fc);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/flowcharts/${id}`, { method: "DELETE" });
    setFlowcharts((prev) => prev.filter((f) => f.id !== id));
    setDeleteId(null);
  }

  if (editing) {
    return <FlowchartEditor initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t.flowcharts.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.flowcharts.subtitle}</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
        >
          {t.flowcharts.new}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 py-12 text-center">{t.common.loading}</div>
      ) : flowcharts.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-10 sm:p-12 text-center">
          <div className="flex justify-center mb-4"><GitBranch className="w-10 h-10 text-gray-300 dark:text-gray-600" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{t.flowcharts.noFlowcharts}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.flowcharts.noFlowchartsDesc}</p>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {t.flowcharts.new}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {flowcharts.map((fc) => (
            <div
              key={fc.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{fc.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                  {`${(fc.nodes as Node[]).length} ${(fc.nodes as Node[]).length !== 1 ? t.flowcharts.steps : t.flowcharts.step}`} · {t.flowcharts.updatedAt}{" "}
                  {new Date(fc.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditing(fc)}
                  className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors"
                >
                  {t.common.edit}
                </button>
                <button
                  onClick={() => setDeleteId(fc.id)}
                  className="border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors"
                >
                  {t.common.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full sm:max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{t.flowcharts.deleteTitle}</h3>
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
