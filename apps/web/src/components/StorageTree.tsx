"use client";

import { useState } from "react";

const TYPE_ICONS: Record<string, string> = {
  ROOM: "🏠",
  FREEZER: "❄️",
  REFRIGERATOR: "🧊",
  SHELF: "📚",
  RACK: "🗄️",
  BOX: "📦",
  DRAWER: "🗃️",
  CABINET: "🚪",
};

interface StorageNode {
  id: string;
  name: string;
  type: string;
  temperature?: number | null;
  capacity?: number | null;
  children?: StorageNode[];
  _count?: { samples: number };
}

interface StorageTreeNodeProps {
  node: StorageNode;
  level: number;
  selectedId: string | null;
  onSelectLocation: (id: string) => void;
}

function StorageTreeNode({
  node,
  level,
  selectedId,
  onSelectLocation,
}: StorageTreeNodeProps) {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const sampleCount = node._count?.samples ?? 0;

  const handleClick = () => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
    onSelectLocation(node.id);
  };

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 ${
          isSelected ? "bg-primary-50 font-medium text-primary-700" : "text-gray-700"
        }`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={handleClick}
      >
        {/* Expand/collapse indicator */}
        <span className="w-4 shrink-0 text-xs text-gray-400">
          {hasChildren ? (expanded ? "▾" : "▸") : ""}
        </span>

        {/* Type icon */}
        <span className="shrink-0">{TYPE_ICONS[node.type] ?? "📁"}</span>

        {/* Name */}
        <span className="flex-1 truncate">{node.name}</span>

        {/* Temperature badge */}
        {node.temperature != null && (
          <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
            {node.temperature}°C
          </span>
        )}

        {/* Sample count badge */}
        {sampleCount > 0 && (
          <span className="shrink-0 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
            {sampleCount}
          </span>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <StorageTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelectLocation={onSelectLocation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface StorageTreeProps {
  nodes: StorageNode[];
  selectedId: string | null;
  onSelectLocation: (id: string) => void;
}

export default function StorageTree({
  nodes,
  selectedId,
  onSelectLocation,
}: StorageTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No storage locations configured
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <StorageTreeNode
          key={node.id}
          node={node}
          level={0}
          selectedId={selectedId}
          onSelectLocation={onSelectLocation}
        />
      ))}
    </div>
  );
}
