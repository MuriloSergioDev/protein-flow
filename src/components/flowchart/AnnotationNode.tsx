"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useState } from "react";
import { PenLine } from "lucide-react";

export default function AnnotationNode({ data, selected }: NodeProps) {
  const [label, setLabel] = useState(String(data.label ?? "Anotação"));

  return (
    <div
      className={`bg-white border-2 rounded-xl px-4 py-3 min-w-[200px] shadow-sm ${
        selected ? "border-blue-500" : "border-gray-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded bg-yellow-100 flex items-center justify-center">
          <PenLine className="w-3 h-3 text-yellow-600" />
        </div>
        <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Anotação</span>
      </div>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="text-sm text-gray-800 w-full border-none outline-none bg-transparent"
        onClick={(e) => e.stopPropagation()}
      />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400" />
    </div>
  );
}
