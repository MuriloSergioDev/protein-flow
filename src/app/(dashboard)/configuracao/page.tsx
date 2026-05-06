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

const nodeTypes = { annotation: AnnotationNode, photo: PhotoNode };

type Flowchart = {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  updatedAt: string;
};

function loadFlowcharts(): Flowchart[] {
  try {
    return JSON.parse(localStorage.getItem("flowcharts") ?? "[]");
  } catch {
    return [];
  }
}

function saveFlowcharts(list: Flowchart[]) {
  localStorage.setItem("flowcharts", JSON.stringify(list));
  // keep flowchart_draft pointing to last saved for launch page
  if (list.length > 0) {
    const last = list[list.length - 1];
    localStorage.setItem("flowchart_draft", JSON.stringify(last));
  }
}

// ─── Editor ────────────────────────────────────────────────────────────────

function FlowchartEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Flowchart;
  onSave: (fc: Flowchart) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [saved, setSaved] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  function addNode(type: "annotation" | "photo") {
    const newNode: Node = {
      id: `${Date.now()}`,
      type,
      position: { x: 100 + Math.random() * 200, y: 100 + nodes.length * 120 },
      data: { label: type === "annotation" ? "Nova anotação" : "Nova foto" },
    };
    setNodes((nds) => [...nds, newNode]);
  }

  function handleSave() {
    const fc: Flowchart = {
      ...initial,
      name,
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
    };
    onSave(fc);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ← Voltar
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => addNode("annotation")}
            className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            + Anotação
          </button>
          <button
            onClick={() => addNode("photo")}
            className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            + Foto
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            {saved ? "Salvo!" : "Salvar"}
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

// ─── List ───────────────────────────────────────────────────────────────────

export default function ConfiguracaoPage() {
  const [flowcharts, setFlowcharts] = useState<Flowchart[]>([]);
  const [editing, setEditing] = useState<Flowchart | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setFlowcharts(loadFlowcharts());
  }, []);

  function handleCreate() {
    const fc: Flowchart = {
      id: `${Date.now()}`,
      name: "Novo Fluxograma",
      nodes: [
        {
          id: "1",
          type: "annotation",
          position: { x: 100, y: 100 },
          data: { label: "Recebimento da matéria-prima" },
        },
      ],
      edges: [],
      updatedAt: new Date().toISOString(),
    };
    setEditing(fc);
  }

  function handleSave(fc: Flowchart) {
    setFlowcharts((prev) => {
      const exists = prev.find((f) => f.id === fc.id);
      const next = exists ? prev.map((f) => (f.id === fc.id ? fc : f)) : [...prev, fc];
      saveFlowcharts(next);
      return next;
    });
  }

  function handleDelete(id: string) {
    setFlowcharts((prev) => {
      const next = prev.filter((f) => f.id !== id);
      saveFlowcharts(next);
      return next;
    });
    setDeleteId(null);
  }

  if (editing) {
    return (
      <FlowchartEditor
        initial={editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuração</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie seus fluxogramas de beneficiamento</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo Fluxograma
        </button>
      </div>

      {flowcharts.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <p className="text-4xl mb-4">📋</p>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Nenhum fluxograma criado</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Crie seu primeiro fluxograma para começar a registrar lançamentos.</p>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            + Novo Fluxograma
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {flowcharts.map((fc) => (
            <div
              key={fc.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5 py-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{fc.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {fc.nodes.length} etapa{fc.nodes.length !== 1 ? "s" : ""} · atualizado em{" "}
                  {new Date(fc.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(fc)}
                  className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleteId(fc.id)}
                  className="border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Apagar fluxograma?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
