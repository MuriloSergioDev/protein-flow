"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PenLine, Camera, CheckCircle2, Rocket, Upload } from "lucide-react";
import { useT } from "@/components/LocaleProvider";
import { useToast } from "@/components/Toast";

// ─── Types ───────────────────────────────────────────────────────────────────

type Protein   = { id: string; name: string };
type Flowchart = { id: string; name: string; nodes: FlowNode[] };
type FlowNode  = { id: string; type: "annotation" | "photo"; data: { label: string } };

type LaunchSummary = {
  id: string;
  proteinId: string;
  flowchartId: string;
  flowchartName: string;
  year: number;
  month: number;
  status: string;
  protein: { id: string; name: string };
  _count?: { steps: number };
};

type LaunchStep = {
  id?: string;
  nodeId: string;
  type: "annotation" | "photo";
  content: string;
  photoUrl: string | null;
  quantity: number | null;
  completed: boolean;
};

type LaunchDetail = LaunchSummary & { steps: Array<{ id: string; nodeId: string; type: string; content: string | null; photoUrl: string | null; quantity: number | null; completedAt: string | null }> };

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function compressImage(file: File, maxWidth = 900): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.src = url;
  });
}

function statusClasses(status: string) {
  return status === "completed"
    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
}

// ─── New Launch Modal ─────────────────────────────────────────────────────────

function NewLaunchModal({
  proteins,
  flowcharts,
  onClose,
  onCreated,
}: {
  proteins: Protein[];
  flowcharts: Flowchart[];
  onClose: () => void;
  onCreated: (launch: LaunchSummary) => void;
}) {
  const t = useT();
  const toast = useToast();
  const [proteinId, setProteinId]     = useState("");
  const [flowchartId, setFlowchartId] = useState("");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleCreate() {
    if (!proteinId || !flowchartId) { setError(t.launches.selectProteinFlowchart); return; }
    setSaving(true);
    setError(null);
    try {
      const fc = flowcharts.find((f) => f.id === flowchartId)!;
      const now = new Date();
      const res = await fetch("/api/launches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proteinId,
          flowchartId,
          flowchartName: fc.name,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      const launch: LaunchSummary = await res.json();
      toast.success(t.toast.launchCreated);
      onCreated(launch);
    } catch {
      setError(t.launches.errorCreate);
      toast.error(t.toast.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full sm:max-w-sm shadow-xl">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5">{t.launches.newLaunchTitle}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.launches.protein}</label>
            <select value={proteinId} onChange={(e) => setProteinId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{t.launches.selectProtein}</option>
              {proteins.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.launches.flowchart}</label>
            <select value={flowchartId} onChange={(e) => setFlowchartId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{t.launches.selectFlowchart}</option>
              {flowcharts.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose}
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm px-4 py-2 rounded-lg transition-colors">
            {t.common.cancel}
          </button>
          <button onClick={handleCreate} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40">
            {saving ? t.launches.creating : t.launches.create}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Period Selection View ────────────────────────────────────────────────────

function PeriodSelectionView({
  launch,
  onBack,
  onSelectPeriod,
}: {
  launch: LaunchSummary;
  onBack: () => void;
  onSelectPeriod: (year: number, month: number, hasData: boolean) => void;
}) {
  const t = useT();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [periodLaunches, setPeriodLaunches] = useState<LaunchSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/launches?proteinId=${launch.proteinId}&flowchartId=${launch.flowchartId}&year=${year}`)
      .then((r) => r.json())
      .then((data) => setPeriodLaunches(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [year, launch.proteinId, launch.flowchartId]);

  function getMonthLaunch(month: number): LaunchSummary | undefined {
    return periodLaunches.find((l) => l.month === month);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 block transition-colors">
        {t.common.back}
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 sm:mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{launch.protein.name} · {launch.flowchartName}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.launches.selectPeriodDesc}</p>
        </div>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 self-start">
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">{t.common.loading}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {t.months.map((name, i) => {
            const month = i + 1;
            const ml = getMonthLaunch(month);
            const hasData = (ml?._count?.steps ?? 0) > 0;
            return (
              <button key={month} onClick={() => onSelectPeriod(year, month, hasData)}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-left hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors group">
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{name}</p>
                {ml ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${statusClasses(ml.status)}`}>
                    {ml.status === "completed" ? t.common.completed : t.common.inProgress}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-2 inline-block">{t.common.notStarted}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Overview View ────────────────────────────────────────────────────────────

function OverviewView({
  launch,
  period,
  flowcharts,
  onBack,
  onEdit,
  onCleared,
}: {
  launch: LaunchSummary;
  period: { year: number; month: number };
  flowcharts: Flowchart[];
  onBack: () => void;
  onEdit: () => void;
  onCleared: () => void;
}) {
  const t = useT();
  const [detail, setDetail] = useState<LaunchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const flowchart = flowcharts.find((f) => f.id === launch.flowchartId);

  useEffect(() => {
    fetch(`/api/launches?proteinId=${launch.proteinId}&flowchartId=${launch.flowchartId}&year=${period.year}&month=${period.month}`)
      .then((r) => r.json())
      .then(async (list: LaunchSummary[]) => {
        if (list.length > 0) {
          const d = await fetch(`/api/launches/${list[0].id}`).then((r) => r.json());
          setDetail(d);
        }
        setLoading(false);
      });
  }, [launch.proteinId, launch.flowchartId, period.year, period.month]);

  async function handleClear() {
    if (!detail) return;
    setClearing(true);
    await fetch(`/api/launches/${detail.id}`, { method: "DELETE" });
    onCleared();
  }

  // Annotation steps ordered by flowchart node position, filtered to those with a quantity
  const annotationWeights = (flowchart?.nodes ?? [])
    .filter((n) => n.type === "annotation")
    .map((n) => detail?.steps.find((s) => s.nodeId === n.id)?.quantity ?? null)
    .filter((q): q is number => q !== null);

  const firstPeso = annotationWeights[0] ?? null;
  const lastPeso  = annotationWeights[annotationWeights.length - 1] ?? null;
  const perda     = firstPeso !== null && lastPeso !== null ? firstPeso - lastPeso : null;
  const perdaPct  = firstPeso !== null && perda !== null && firstPeso > 0
    ? (perda / firstPeso) * 100
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 block transition-colors">
        {t.common.back}
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-5 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
            {launch.protein.name} · {launch.flowchartName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.months[period.month - 1]} / {period.year}
          </p>
        </div>
        {detail && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium self-start mt-1 ${statusClasses(detail.status)}`}>
            {detail.status === "completed" ? t.common.completed : t.common.inProgress}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">{t.common.loading}</div>
      ) : !detail ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">{t.launches.dataNotFound}</div>
      ) : (
        <>
          {/* Summary card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.launches.initialWeight}</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {firstPeso !== null ? `${firstPeso.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.launches.finalWeight}</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {lastPeso !== null ? `${lastPeso.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.launches.totalLoss}</p>
              <p className={`text-base font-bold ${perda !== null && perda > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                {perda !== null ? `${perda.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.launches.lossPct}</p>
              <p className={`text-base font-bold ${perdaPct !== null && perdaPct > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                {perdaPct !== null ? `${perdaPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—"}
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            {flowchart?.nodes.map((node, i) => {
              const step = detail.steps.find((s) => s.nodeId === node.id);
              return (
                <div key={node.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {node.type === "annotation"
                      ? <PenLine className="w-4 h-4 text-yellow-500 shrink-0" />
                      : <Camera className="w-4 h-4 text-purple-500 shrink-0" />}
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {t.common.step} {i + 1}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{node.data.label}</p>
                    {step?.completedAt && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t.common.completed}
                      </span>
                    )}
                  </div>
                  {node.type === "annotation" && (
                    <div className="flex flex-wrap items-start gap-3 sm:gap-6 pl-3 sm:pl-6">
                      {step?.quantity != null && (
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{t.launches.pesoBruto}</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {step.quantity.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg
                          </p>
                        </div>
                      )}
                      {step?.content && (
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{t.launches.annotationLabel}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{step.content}</p>
                        </div>
                      )}
                      {!step && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t.launches.notFilledStep}</p>
                      )}
                    </div>
                  )}
                  {node.type === "photo" && (
                    <div className="pl-3 sm:pl-6">
                      {step?.photoUrl ? (
                        <img src={step.photoUrl} alt="Foto" className="h-24 w-full sm:w-36 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t.launches.notFilledStep}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onEdit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              {t.launches.editData}
            </button>
            <button onClick={() => setConfirmClear(true)}
              className="border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-sm px-4 py-2.5 rounded-lg transition-colors">
              {t.launches.clearData}
            </button>
          </div>
        </>
      )}

      {confirmClear && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full sm:max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{t.launches.clearConfirmTitle}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {`${t.launches.clearConfirmDesc.replace("{period}", `${t.months[period.month - 1]}/${period.year}`)}`}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmClear(false)} disabled={clearing}
                className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm px-4 py-2 rounded-lg transition-colors">
                {t.common.cancel}
              </button>
              <button onClick={handleClear} disabled={clearing}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40">
                {clearing ? t.common.clearing : t.common.clear}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Steps View ───────────────────────────────────────────────────────────────

function StepsView({
  launch,
  flowcharts,
  onBack,
  onSaved,
  onSaveComplete,
  initialYear,
  initialMonth,
}: {
  launch: LaunchSummary;
  flowcharts: Flowchart[];
  onBack: () => void;
  onSaved: (updated: LaunchSummary) => void;
  onSaveComplete: (updated: LaunchSummary, year: number, month: number) => void;
  initialYear: number;
  initialMonth: number;
}) {
  const t = useT();
  const toast = useToast();
  const flowchart = flowcharts.find((f) => f.id === launch.flowchartId);
  const [year, setYear]   = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [currentLaunch, setCurrentLaunch] = useState<LaunchSummary>(launch);
  const [steps, setSteps] = useState<LaunchStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activePhotoNodeId = useRef<string | null>(null);

  const initSteps = useCallback((nodes: FlowNode[], existingSteps: LaunchDetail["steps"]) => {
    return nodes.map((node) => {
      const existing = existingSteps.find((s) => s.nodeId === node.id);
      return {
        id: existing?.id,
        nodeId: node.id,
        type: node.type,
        content: existing?.content ?? "",
        photoUrl: existing?.photoUrl ?? null,
        quantity: existing?.quantity ?? null,
        completed: !!existing?.completedAt,
      };
    });
  }, []);

  // Load detail for current period
  useEffect(() => {
    if (!flowchart) return;
    setLoadingPeriod(true);

    fetch(`/api/launches?proteinId=${launch.proteinId}&flowchartId=${launch.flowchartId}&year=${year}&month=${month}`)
      .then((r) => r.json())
      .then(async (list: LaunchSummary[]) => {
        if (list.length > 0) {
          const detail = await fetch(`/api/launches/${list[0].id}`).then((r) => r.json()) as LaunchDetail;
          setCurrentLaunch(list[0]);
          setSteps(initSteps(flowchart.nodes, detail.steps));
        } else {
          setCurrentLaunch({ ...launch, id: "", year, month, status: "in_progress" });
          setSteps(initSteps(flowchart.nodes, []));
        }
        setCurrentStep(0);
      })
      .finally(() => setLoadingPeriod(false));
  }, [year, month, launch.proteinId, launch.flowchartId, flowchart, initSteps, launch]);

  function updateStep(nodeId: string, patch: Partial<LaunchStep>) {
    setSteps((prev) => prev.map((s) => s.nodeId === nodeId ? { ...s, ...patch } : s));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activePhotoNodeId.current) return;
    const nodeId = activePhotoNodeId.current;
    const dataUrl = await compressImage(file);
    updateStep(nodeId, { photoUrl: dataUrl, completed: true });
  }

  async function handleSave(complete = false) {
    if (!flowchart) return;
    setSaving(true);
    try {
      let launchId = currentLaunch.id;

      if (!launchId) {
        const res = await fetch("/api/launches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proteinId: launch.proteinId, flowchartId: launch.flowchartId, flowchartName: launch.flowchartName, year, month }),
        });
        const created: LaunchSummary = await res.json();
        launchId = created.id;
        setCurrentLaunch(created);
      }

      const res = await fetch(`/api/launches/${launchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps, complete }),
      });
      const updated: LaunchSummary = await res.json();
      setCurrentLaunch(updated);
      onSaved(updated);
      toast.success(complete ? t.toast.launchCompleted : t.toast.launchSaved);
      onSaveComplete(updated, year, month);
    } catch {
      toast.error(t.toast.error);
    } finally {
      setSaving(false);
    }
  }

  function completeStep(nodeId: string) {
    updateStep(nodeId, { completed: true });
    if (currentStep < (flowchart?.nodes.length ?? 1) - 1) setCurrentStep((s) => s + 1);
  }

  if (!flowchart) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t.launches.flowchartNotFound}</p>
        <button onClick={onBack} className="mt-4 text-sm text-blue-600 dark:text-blue-400 underline">{t.common.back}</button>
      </div>
    );
  }

  const activeNode = flowchart.nodes[currentStep];
  const activeStep = steps[currentStep];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 block transition-colors">
          {t.common.back}
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{launch.protein.name} · {launch.flowchartName}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClasses(currentLaunch.status)}`}>
                {currentLaunch.status === "completed" ? t.common.completed : t.common.inProgress}
              </span>
            </div>
          </div>
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {t.months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loadingPeriod ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">{t.launches.loadingPeriod}</div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="flex gap-1.5 sm:gap-2 mb-5 sm:mb-6">
            {flowchart.nodes.map((node, i) => (
              <button key={node.id} onClick={() => setCurrentStep(i)}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  steps[i]?.completed ? "bg-green-500" : i === currentStep ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                }`} />
            ))}
          </div>

          {/* Active step */}
          {activeNode && activeStep !== undefined && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeNode.type === "annotation" ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-purple-100 dark:bg-purple-900/30"}`}>
                  {activeNode.type === "annotation"
                    ? <PenLine className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    : <Camera className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {activeNode.type === "annotation" ? t.launches.annotation : t.launches.photo} · {t.common.step} {currentStep + 1} {t.common.of} {flowchart.nodes.length}
                  </p>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{activeNode.data.label}</h3>
                </div>
              </div>

              {activeNode.type === "annotation" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.launches.pesoBruto} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={activeStep.quantity ?? ""}
                      onChange={(e) => updateStep(activeNode.id, { quantity: e.target.value === "" ? null : parseFloat(e.target.value) })}
                      placeholder="0,00"
                      className="w-full sm:w-44 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.launches.annotationLabel} <span className="text-gray-400 dark:text-gray-600 font-normal">({t.common.optional})</span></label>
                    <textarea
                      value={activeStep.content}
                      onChange={(e) => updateStep(activeNode.id, { content: e.target.value })}
                      placeholder={t.launches.annotationPlaceholder}
                      rows={4}
                      className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {activeNode.type === "photo" && (
                <div className="space-y-3">
                  {activeStep.photoUrl ? (
                    <div className="relative">
                      <img src={activeStep.photoUrl} alt="Foto" className="w-full h-48 sm:h-56 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                      <button onClick={() => updateStep(activeNode.id, { photoUrl: null, completed: false })}
                        className="absolute top-2 right-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        {t.launches.swap}
                      </button>
                    </div>
                  ) : activeStep.completed ? (
                    <div className="h-36 sm:h-40 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-600 dark:text-green-400">{t.launches.photoRegistered}</span>
                    </div>
                  ) : (
                    <button onClick={() => { activePhotoNodeId.current = activeNode.id; fileInputRef.current?.click(); }}
                      className="w-full h-36 sm:h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t.launches.clickToSelectPhoto}</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                </div>
              )}

              <div className="flex justify-between items-center mt-5 sm:mt-6">
                <button onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 transition-colors px-1 py-1">
                  {t.common.previous}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => handleSave(false)} disabled={saving}
                    className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm px-3 sm:px-4 py-2 rounded-lg transition-colors disabled:opacity-40">
                    {saving ? t.common.saving : t.common.save}
                  </button>
                  {currentStep < flowchart.nodes.length - 1 ? (
                    <button
                      onClick={() => completeStep(activeNode.id)}
                      disabled={(activeNode.type === "annotation" && activeStep.quantity == null) || (activeNode.type === "photo" && !activeStep.photoUrl && !activeStep.completed)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 sm:px-5 py-2 rounded-lg transition-colors disabled:opacity-40">
                      {t.common.next}
                    </button>
                  ) : (
                    <button
                      onClick={() => { completeStep(activeNode.id); handleSave(true); }}
                      disabled={(activeNode.type === "annotation" && activeStep.quantity == null) || (activeNode.type === "photo" && !activeStep.photoUrl && !activeStep.completed)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 sm:px-5 py-2 rounded-lg transition-colors disabled:opacity-40">
                      {t.common.complete}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {flowchart.nodes.map((node, i) => (
              <div key={node.id} onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  i === currentStep
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30"
                    : steps[i]?.completed
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}>
                {steps[i]?.completed
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  : node.type === "annotation"
                    ? <PenLine className="w-4 h-4 text-yellow-500 shrink-0" />
                    : <Camera className="w-4 h-4 text-purple-500 shrink-0" />}
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{node.data.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

type GroupKey = { proteinId: string; flowchartId: string };

function LaunchList({
  launches,
  loading,
  onNew,
  onSelect,
  onDelete,
}: {
  launches: LaunchSummary[];
  loading: boolean;
  onNew: () => void;
  onSelect: (launch: LaunchSummary) => void;
  onDelete: (proteinId: string, flowchartId: string) => void;
}) {
  const t = useT();
  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<GroupKey | null>(null);

  const groups: LaunchSummary[] = [];
  const seen = new Set<string>();
  for (const l of launches) {
    const key = `${l.proteinId}::${l.flowchartId}`;
    if (!seen.has(key)) { seen.add(key); groups.push(l); }
  }

  async function confirmDelete({ proteinId, flowchartId }: GroupKey) {
    try {
      await fetch("/api/launches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proteinId, flowchartId }),
      });
      toast.success(t.toast.launchDeleted);
    } catch {
      toast.error(t.toast.error);
    }
    onDelete(proteinId, flowchartId);
    setDeleteTarget(null);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t.launches.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.launches.subtitle}</p>
        </div>
        <button onClick={onNew}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors self-start sm:self-auto">
          {t.launches.newLaunch}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 py-12 text-center">{t.common.loading}</div>
      ) : groups.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-10 sm:p-12 text-center">
          <div className="flex justify-center mb-4"><Rocket className="w-10 h-10 text-gray-300 dark:text-gray-600" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{t.launches.noLaunches}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.launches.noLaunchesDesc}</p>
          <button onClick={onNew}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
            {t.launches.newLaunch}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
            {groups.map((launch) => (
              <div key={`${launch.proteinId}::${launch.flowchartId}`}
                className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{launch.protein.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{launch.flowchartName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => onSelect(launch)}
                    className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs px-3 py-1.5 rounded-lg transition-colors">
                    {t.common.open}
                  </button>
                  <button onClick={() => setDeleteTarget({ proteinId: launch.proteinId, flowchartId: launch.flowchartId })}
                    className="border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-xs px-3 py-1.5 rounded-lg transition-colors">
                    {t.common.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <table className="hidden sm:table w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.launches.protein}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.launches.flowchart}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {groups.map((launch) => (
                <tr key={`${launch.proteinId}::${launch.flowchartId}`}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{launch.protein.name}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{launch.flowchartName}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => onSelect(launch)}
                        className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs px-3 py-1.5 rounded-lg transition-colors">
                        {t.common.open}
                      </button>
                      <button onClick={() => setDeleteTarget({ proteinId: launch.proteinId, flowchartId: launch.flowchartId })}
                        className="border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-xs px-3 py-1.5 rounded-lg transition-colors">
                        {t.common.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full sm:max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{t.launches.deleteAllConfirmTitle}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.launches.deleteAllConfirmDesc}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm px-4 py-2 rounded-lg transition-colors">
                {t.common.cancel}
              </button>
              <button onClick={() => confirmDelete(deleteTarget)}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type View = "list" | "period" | "overview" | "steps";

export default function LancamentoPage() {
  const t = useT();
  const [launches, setLaunches]     = useState<LaunchSummary[]>([]);
  const [proteins, setProteins]     = useState<Protein[]>([]);
  const [flowcharts, setFlowcharts] = useState<Flowchart[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showNew, setShowNew]       = useState(false);
  const [view, setView]             = useState<View>("list");
  const [selectedGroup, setSelectedGroup]   = useState<LaunchSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<{ year: number; month: number } | null>(null);
  const [stepsBackTo, setStepsBackTo] = useState<"period" | "overview">("period");

  useEffect(() => {
    Promise.all([
      fetch("/api/launches").then((r) => r.json()),
      fetch("/api/proteins").then((r) => r.json()),
      fetch("/api/flowcharts").then((r) => r.json()),
    ]).then(([ls, ps, fcs]) => {
      setLaunches(Array.isArray(ls) ? ls : []);
      setProteins(Array.isArray(ps) ? ps : []);
      setFlowcharts(Array.isArray(fcs) ? fcs : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function handleCreated(launch: LaunchSummary) {
    setLaunches((prev) => {
      const exists = prev.find((l) => l.id === launch.id);
      return exists ? prev : [launch, ...prev];
    });
    setShowNew(false);
    setSelectedGroup(launch);
    setView("period");
  }

  function handleSaved(updated: LaunchSummary) {
    setLaunches((prev) => prev.map((l) => l.id === updated.id ? updated : l));
  }

  function handleSaveComplete(updated: LaunchSummary, year: number, month: number) {
    setLaunches((prev) => prev.map((l) => l.id === updated.id ? updated : l));
    setSelectedGroup(updated);
    setSelectedPeriod({ year, month });
    setView("overview");
  }

  if (view === "steps" && selectedGroup && selectedPeriod) {
    return (
      <StepsView
        launch={selectedGroup}
        flowcharts={flowcharts}
        onBack={() => setView(stepsBackTo)}
        onSaved={handleSaved}
        onSaveComplete={handleSaveComplete}
        initialYear={selectedPeriod.year}
        initialMonth={selectedPeriod.month}
      />
    );
  }

  if (view === "overview" && selectedGroup && selectedPeriod) {
    return (
      <OverviewView
        launch={selectedGroup}
        period={selectedPeriod}
        flowcharts={flowcharts}
        onBack={() => setView("period")}
        onEdit={() => { setStepsBackTo("overview"); setView("steps"); }}
        onCleared={() => setView("period")}
      />
    );
  }

  if (view === "period" && selectedGroup) {
    return (
      <PeriodSelectionView
        launch={selectedGroup}
        onBack={() => setView("list")}
        onSelectPeriod={(year, month, hasData) => {
          setSelectedPeriod({ year, month });
          setStepsBackTo("period");
          setView(hasData ? "overview" : "steps");
        }}
      />
    );
  }

  return (
    <>
      <LaunchList
        launches={launches}
        loading={loading}
        onNew={() => setShowNew(true)}
        onSelect={(launch) => { setSelectedGroup(launch); setView("period"); }}
        onDelete={(proteinId, flowchartId) => setLaunches((prev) => prev.filter((l) => !(l.proteinId === proteinId && l.flowchartId === flowchartId)))}
      />
      {showNew && (
        <NewLaunchModal
          proteins={proteins}
          flowcharts={flowcharts}
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
