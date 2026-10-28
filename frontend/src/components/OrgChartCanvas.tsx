import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { Company, Employee } from "../types";
import { NodeCard } from "./NodeCard";

interface OrgChartCanvasProps {
  company: Company;
  selectedEmployeeId?: string;
  onSelectEmployee: (emp: Employee) => void;
  highlightedEmployeeIds: Set<string>;
  economicBuyerId?: string;
  compareWithGroundTruth?: boolean;
  departmentFilter: string;
}

const CARD_WIDTH = 240;
const CARD_HEIGHT = 130;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 85;

export const OrgChartCanvas: React.FC<OrgChartCanvasProps> = ({
  company,
  selectedEmployeeId,
  onSelectEmployee,
  highlightedEmployeeIds,
  economicBuyerId,
  compareWithGroundTruth = false,
  departmentFilter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filter employees if department is selected
  const activeEmployees = useMemo(() => {
    if (departmentFilter === "All") {
      return company.employees;
    }
    // Include CEO + employees in department
    return company.employees.filter(
      (e) =>
        e.inferred_seniority === "L0_EXEC" ||
        e.inferred_department === departmentFilter
    );
  }, [company.employees, departmentFilter]);

  const activeEmpMap = useMemo(() => {
    return new Map(activeEmployees.map((e) => [e.id, e]));
  }, [activeEmployees]);

  // Compute hierarchical tree positions
  const { nodePositions } = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    if (!company.employees.length) return { nodePositions: positions };

    // Find root (CEO)
    const ceo =
      company.employees.find((e) => e.inferred_seniority === "L0_EXEC") ||
      company.employees[0];

    // Build children mapping for active primary edges
    const childrenMap = new Map<string, string[]>();
    for (const edge of company.inferred_edges) {
      if (edge.edge_type === "primary" && activeEmpMap.has(edge.source_id) && activeEmpMap.has(edge.target_id)) {
        if (!childrenMap.has(edge.target_id)) {
          childrenMap.set(edge.target_id, []);
        }
        childrenMap.get(edge.target_id)!.push(edge.source_id);
      }
    }

    // Subtree width calculation
    const subtreeWidths = new Map<string, number>();

    const calcSubtreeWidth = (nodeId: string): number => {
      const children = childrenMap.get(nodeId) || [];
      if (children.length === 0) {
        subtreeWidths.set(nodeId, CARD_WIDTH + HORIZONTAL_GAP);
        return CARD_WIDTH + HORIZONTAL_GAP;
      }
      let totalW = 0;
      for (const childId of children) {
        totalW += calcSubtreeWidth(childId);
      }
      const w = Math.max(CARD_WIDTH + HORIZONTAL_GAP, totalW);
      subtreeWidths.set(nodeId, w);
      return w;
    };

    calcSubtreeWidth(ceo.id);

    // Layout tree recursively
    let minY = 50;
    let maxY = 50;
    let minX = 0;
    let maxX = 0;

    const layoutSubtree = (nodeId: string, xCenter: number, y: number) => {
      positions.set(nodeId, { x: xCenter - CARD_WIDTH / 2, y });
      minX = Math.min(minX, xCenter - CARD_WIDTH / 2);
      maxX = Math.max(maxX, xCenter + CARD_WIDTH / 2);
      maxY = Math.max(maxY, y + CARD_HEIGHT);

      const children = childrenMap.get(nodeId) || [];
      if (children.length === 0) return;

      const totalSubtreeW = subtreeWidths.get(nodeId) || CARD_WIDTH + HORIZONTAL_GAP;
      let curLeft = xCenter - totalSubtreeW / 2;

      for (const childId of children) {
        const childW = subtreeWidths.get(childId) || CARD_WIDTH + HORIZONTAL_GAP;
        const childXCenter = curLeft + childW / 2;
        layoutSubtree(childId, childXCenter, y + CARD_HEIGHT + VERTICAL_GAP);
        curLeft += childW;
      }
    };

    layoutSubtree(ceo.id, 0, 60);

    // Also layout any unassigned / orphan nodes in a side cluster
    const unassignedEmps = activeEmployees.filter(
      (e) => !positions.has(e.id) && e.id !== ceo.id
    );

    if (unassignedEmps.length > 0) {
      let unassignedX = maxX + 100;
      let unassignedY = 60;
      for (let i = 0; i < unassignedEmps.length; i++) {
        const u = unassignedEmps[i];
        positions.set(u.id, { x: unassignedX, y: unassignedY });
        unassignedY += CARD_HEIGHT + 24;
        maxX = Math.max(maxX, unassignedX + CARD_WIDTH);
        maxY = Math.max(maxY, unassignedY);
      }
    }

    return {
      nodePositions: positions,
      treeBounds: { width: maxX - minX, height: maxY - minY },
    };
  }, [company, activeEmployees, activeEmpMap]);

  // Center tree on initial load
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth } = containerRef.current;
      setPan({ x: clientWidth / 2, y: 40 });
    }
  }, [company.id]);

  // Auto-center canvas when employee is selected or targeted by sales query
  useEffect(() => {
    if (selectedEmployeeId && containerRef.current && nodePositions.has(selectedEmployeeId)) {
      const pos = nodePositions.get(selectedEmployeeId)!;
      const { clientWidth, clientHeight } = containerRef.current;
      setPan({
        x: clientWidth / 2 - (pos.x + CARD_WIDTH / 2) * scale,
        y: clientHeight / 2 - (pos.y + CARD_HEIGHT / 2) * scale,
      });
    }
  }, [selectedEmployeeId, nodePositions, scale]);

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".node-card-interactive")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale((prev) => Math.min(2.0, Math.max(0.3, prev * zoomFactor)));
  };

  const resetView = () => {
    if (containerRef.current) {
      setPan({ x: containerRef.current.clientWidth / 2, y: 40 });
      setScale(0.85);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#f8fafc",
        backgroundImage: "radial-gradient(#cbd5e1 1.2px, transparent 1.2px)",
        backgroundSize: "24px 24px",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
    >
      {/* Floating Canvas Controls */}
      <div
        className="glass"
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px",
          borderRadius: "8px",
          zIndex: 50,
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        <button
          onClick={() => setScale((s) => Math.min(2.0, s * 1.15))}
          className="btn-secondary"
          style={{ padding: "6px 8px", border: "none", boxShadow: "none" }}
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.3, s * 0.85))}
          className="btn-secondary"
          style={{ padding: "6px 8px", border: "none", boxShadow: "none" }}
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={resetView}
          className="btn-secondary"
          style={{ padding: "6px 8px", border: "none", boxShadow: "none" }}
          title="Reset View"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Canvas Viewport (Panned & Scaled) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          transition: isDragging ? "none" : "transform 0.05s ease-out",
        }}
      >
        {/* SVG Connector Lines */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "12000px",
            height: "12000px",
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          {company.inferred_edges.map((edge) => {
            const sourcePos = nodePositions.get(edge.source_id);
            const targetPos = nodePositions.get(edge.target_id);
            if (!sourcePos || !targetPos) return null;

            // Target is Manager (parent at top), Source is Subordinate (at bottom)
            const x1 = targetPos.x + CARD_WIDTH / 2;
            const y1 = targetPos.y + CARD_HEIGHT;
            const x2 = sourcePos.x + CARD_WIDTH / 2;
            const y2 = sourcePos.y;

            const isMatrix = edge.edge_type === "matrix";
            const isHighlighted =
              highlightedEmployeeIds.has(edge.source_id) &&
              highlightedEmployeeIds.has(edge.target_id);

            // Smooth cubic bezier curve
            const midY = (y1 + y2) / 2;
            const pathData = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

            return (
              <g key={`${edge.source_id}->${edge.target_id}`}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={
                    isHighlighted
                      ? "#2563eb"
                      : isMatrix
                      ? "#7c3aed"
                      : "#cbd5e1"
                  }
                  strokeWidth={isHighlighted ? 3 : isMatrix ? 1.75 : 1.5}
                  strokeDasharray={isMatrix ? "4 4" : "none"}
                />
              </g>
            );
          })}
        </svg>

        {/* Node Cards */}
        {activeEmployees.map((emp) => {
          const pos = nodePositions.get(emp.id);
          if (!pos) return null;

          const isSelected = selectedEmployeeId === emp.id;
          const isHighlighted = highlightedEmployeeIds.has(emp.id);
          const isEconBuyer = economicBuyerId === emp.id;

          return (
            <div
              key={emp.id}
              className="node-card-interactive"
              style={{
                position: "absolute",
                left: `${pos.x}px`,
                top: `${pos.y}px`,
              }}
            >
              <NodeCard
                employee={emp}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isEconomicBuyer={isEconBuyer}
                compareWithGroundTruth={compareWithGroundTruth}
                onClick={() => onSelectEmployee(emp)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
