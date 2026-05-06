"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useState } from "react";
import { Camera } from "lucide-react";

export default function PhotoNode({ data, selected }: NodeProps) {
  const [label, setLabel] = useState(String(data.label ?? "Foto"));

  return (
    <div
      className={`bg-white border-2 rounded-xl px-4 py-3 min-w-[200px] shadow-sm ${
        selected ? "border-blue-500" : "border-purple-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-purple-400" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
          <Camera className="w-3 h-3 text-purple-600" />
        </div>
        <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Foto</span>
      </div>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="text-sm text-gray-800 w-full border-none outline-none bg-transparent"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="text-xs text-gray-400 mt-1">Requer foto no lançamento</p>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400" />
    </div>
  );
}
