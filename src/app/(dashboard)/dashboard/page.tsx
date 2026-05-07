"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Link from "next/link";
import { ChartBarBig } from "lucide-react";
import { useT } from "@/components/LocaleProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

type Launch = {
  id: string;
  proteinId: string;
  flowchartId: string;
  flowchartName: string;
  year: number;
  month: number;
  status: string;
  protein: { id: string; name: string };
};

type LaunchDetail = Launch & {
  steps: Array<{ nodeId: string; quantity: number | null }>;
};

type ChartMonth = {
  month: string;
  perdaKg: number | null;
  perdaPct: number | null;
  status: string | null;
};

type FlowNode = { id: string; type: string };
type Flowchart = { id: string; name: string; nodes: FlowNode[] };

type Metric = "perdaKg" | "perdaPct";

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function barColor(status: string | null) {
  if (status === "completed")   return "#22c55e";
  if (status === "in_progress") return "#f59e0b";
  return "#e5e7eb";
}

function fmt(n: number, decimals = 1) {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: decimals });
}

function calcLoss(detail: LaunchDetail, flowchart: Flowchart | undefined) {
  const weights = (flowchart?.nodes ?? [])
    .filter((n) => n.type === "annotation")
    .map((n) => detail.steps.find((s) => s.nodeId === n.id)?.quantity ?? null)
    .filter((q): q is number => q !== null);

  const first = weights[0] ?? null;
  const last  = weights[weights.length - 1] ?? null;
  const perdaKg  = first !== null && last !== null ? first - last : null;
  const perdaPct = first !== null && perdaKg !== null && first > 0
    ? (perdaKg / first) * 100
    : null;
  return { perdaKg, perdaPct };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const t = useT();

  const [launches, setLaunches]                 = useState<Launch[]>([]);
  const [flowcharts, setFlowcharts]             = useState<Flowchart[]>([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState("");
  const [selectedYear, setSelectedYear]         = useState(CURRENT_YEAR);
  const [metric, setMetric]                     = useState<Metric>("perdaKg");
  const [chartData, setChartData]               = useState<ChartMonth[]>([]);
  const [loadingLaunches, setLoadingLaunches]   = useState(true);
  const [loadingChart, setLoadingChart]         = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/launches").then((r) => r.json()),
      fetch("/api/flowcharts").then((r) => r.json()),
    ])
      .then(([ls, fcs]) => {
        setLaunches(Array.isArray(ls) ? ls : []);
        setFlowcharts(Array.isArray(fcs) ? fcs : []);
      })
      .catch(() => {})
      .finally(() => setLoadingLaunches(false));
  }, []);

  // Unique protein+flowchart groups
  const groups = useMemo(() => {
    const seen = new Set<string>();
    return launches.filter((l) => {
      const key = `${l.proteinId}::${l.flowchartId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [launches]);

  // Fetch and compute loss data when group or year changes
  useEffect(() => {
    if (!selectedGroupKey) { setChartData([]); return; }
    const [proteinId, flowchartId] = selectedGroupKey.split("::");
    setLoadingChart(true);

    fetch(`/api/launches?proteinId=${proteinId}&flowchartId=${flowchartId}&year=${selectedYear}`)
      .then((r) => r.json())
      .then(async (monthLaunches: Launch[]) => {
        const details: LaunchDetail[] = await Promise.all(
          monthLaunches.map((l) => fetch(`/api/launches/${l.id}`).then((r) => r.json()))
        );

        const flowchart = flowcharts.find((f) => f.id === flowchartId);
        const byMonth: Record<number, ChartMonth> = {};
        details.forEach((d) => {
          const { perdaKg, perdaPct } = calcLoss(d, flowchart);
          byMonth[d.month] = { month: "", perdaKg, perdaPct, status: d.status };
        });

        setChartData(
          t.monthsShort.map((month, i) => ({
            month,
            perdaKg:  byMonth[i + 1]?.perdaKg  ?? null,
            perdaPct: byMonth[i + 1]?.perdaPct  ?? null,
            status:   byMonth[i + 1]?.status    ?? null,
          }))
        );
      })
      .finally(() => setLoadingChart(false));
  }, [selectedGroupKey, selectedYear, flowcharts, t.monthsShort]);

  const selectedGroup = groups.find((l) => `${l.proteinId}::${l.flowchartId}` === selectedGroupKey);

  // Summary stats — only months with actual loss data
  const withData    = chartData.filter((d) => d.perdaKg !== null);
  const avgPerdaKg  = withData.length > 0 ? withData.reduce((s, d) => s + (d.perdaKg ?? 0), 0) / withData.length : null;
  const avgPerdaPct = withData.length > 0 ? withData.reduce((s, d) => s + (d.perdaPct ?? 0), 0) / withData.length : null;
  const maxPerdaPct = withData.length > 0 ? Math.max(...withData.map((d) => d.perdaPct ?? 0)) : null;
  const mesesConcluidos = chartData.filter((d) => d.status === "completed").length;

  const dash = "—";
  const summaryCards = [
    {
      label: t.dashboard.avgLossKg,
      value: avgPerdaKg !== null ? `${fmt(avgPerdaKg, 2)} kg` : dash,
      sub: avgPerdaKg !== null ? `${t.dashboard.avgPerMonth} ${selectedYear}` : t.dashboard.selectLaunchFirst,
    },
    {
      label: t.dashboard.avgLossPct,
      value: avgPerdaPct !== null ? `${fmt(avgPerdaPct, 1)}%` : dash,
      sub: avgPerdaPct !== null ? `${t.dashboard.avgPerMonth} ${selectedYear}` : t.dashboard.selectLaunchFirst,
    },
    {
      label: t.dashboard.maxLossPct,
      value: maxPerdaPct !== null ? `${fmt(maxPerdaPct, 1)}%` : dash,
      sub: maxPerdaPct !== null ? `${t.dashboard.worstMonth} ${selectedYear}` : t.dashboard.selectLaunchFirst,
    },
    {
      label: t.dashboard.monthsCompleted,
      value: selectedGroupKey ? String(mesesConcluidos) : dash,
      sub: selectedGroupKey ? `${t.common.of} ${withData.length} ${t.dashboard.withData}` : t.dashboard.selectLaunchFirst,
    },
  ];

  const activeDataKey = metric;
  const tooltipLabel  = metric === "perdaKg" ? t.dashboard.lossTotalLabel : t.dashboard.lossPctLabel;
  const yUnit         = metric === "perdaKg" ? " kg" : "%";
  const yWidth        = metric === "perdaKg" ? 65 : 45;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t.dashboard.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.dashboard.subtitle}</p>
        </div>
        <Link href="/lancamento"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors self-start sm:self-auto">
          {t.dashboard.newLaunch}
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{card.label}</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-4 sm:mb-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t.dashboard.lossAnnual}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {selectedGroup
                ? `${selectedGroup.protein.name} · ${selectedGroup.flowchartName} · ${selectedYear}`
                : t.dashboard.selectToView}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedGroupKey}
              onChange={(e) => setSelectedGroupKey(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[180px] sm:max-w-xs truncate"
            >
              <option value="">{t.dashboard.selectLaunch}...</option>
              {groups.map((l) => (
                <option key={`${l.proteinId}::${l.flowchartId}`} value={`${l.proteinId}::${l.flowchartId}`}>
                  {l.protein.name} · {l.flowchartName}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {/* Metric toggle */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden text-sm">
              <button
                onClick={() => setMetric("perdaKg")}
                className={`px-3 py-1.5 transition-colors ${metric === "perdaKg" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                kg
              </button>
              <button
                onClick={() => setMetric("perdaPct")}
                className={`px-3 py-1.5 border-l border-gray-300 dark:border-gray-700 transition-colors ${metric === "perdaPct" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                %
              </button>
            </div>
          </div>
        </div>

        {/* Chart area */}
        {!selectedGroupKey ? (
          <div className="h-[220px] sm:h-[300px] flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <ChartBarBig className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center px-4">
              {loadingLaunches ? t.common.loading : groups.length === 0
                ? t.dashboard.noLaunches
                : t.dashboard.selectToView}
            </p>
            {!loadingLaunches && groups.length === 0 && (
              <Link href="/lancamento" className="text-xs text-blue-600 dark:text-blue-400 underline">
                {t.dashboard.createLaunch}
              </Link>
            )}
          </div>
        ) : loadingChart ? (
          <div className="h-[220px] sm:h-[300px] flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">{t.dashboard.loadingData}</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit={yUnit} width={yWidth} />
                <Tooltip
                  formatter={(value: unknown) =>
                    typeof value === "number"
                      ? [`${fmt(value, metric === "perdaKg" ? 2 : 1)}${yUnit}`, tooltipLabel]
                      : ["—", tooltipLabel]
                  }
                  cursor={{ fill: "rgba(99,102,241,0.05)" }}
                />
                <Bar dataKey={activeDataKey} radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry[activeDataKey] !== null ? barColor(entry.status) : "#e5e7eb"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex items-center gap-3 sm:gap-4 mt-3 justify-center text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> {t.common.completed}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> {t.common.inProgress}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700 inline-block" /> {t.dashboard.noData}</span>
            </div>
          </>
        )}
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t.dashboard.lastLaunches}</h3>
          <div className="space-y-3">
            {loadingLaunches ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.common.loading}</p>
            ) : launches.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.dashboard.noLaunchesYet}</p>
            ) : launches.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{l.protein.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{l.flowchartName} · {t.monthsShort[l.month - 1]}/{l.year}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  l.status === "completed"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                }`}>
                  {l.status === "completed" ? t.common.completed : t.common.inProgress}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t.dashboard.activeFlowcharts}</h3>
          <div className="space-y-3">
            {flowcharts.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.dashboard.noFlowcharts}</p>
            ) : flowcharts.slice(0, 5).map((fc) => (
              <div key={fc.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{fc.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{(fc.nodes as unknown[]).length} {t.common.steps}</p>
                </div>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                  Ativo
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
