import { EXECUTIVE_STUDIES } from "@/data/executiveStudies";

/** Capítulos por dia médios (~1189 capítulos / 365 dias) para estimar progresso sem carregar cada plano. */
const PLAN_CHAPTERS_PER_DAY_EST = 1189 / 365;

export type HubCoreMetrics = {
  planReading: number;
  audioExploration: number;
  executiveStudies: number;
};

export function computePlanReadingPercent(): number {
  try {
    const raw = localStorage.getItem("bible_plans");
    if (!raw) return 0;
    const plans = JSON.parse(raw) as { id: string; days_total: number }[];
    let completed = 0;
    let estimateTotal = 0;
    for (const p of plans) {
      const pr = localStorage.getItem(`plan_progress_${p.id}`);
      const n = pr ? Object.keys(JSON.parse(pr) as object).length : 0;
      completed += n;
      estimateTotal += Math.max(Math.ceil(p.days_total * PLAN_CHAPTERS_PER_DAY_EST), n);
    }
    if (estimateTotal <= 0) return 0;
    return Math.min(100, Math.round((100 * completed) / estimateTotal));
  } catch {
    return 0;
  }
}

export function computeAudioExplorationPercent(): number {
  let legacy = 0;
  let chapters = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith("audio_progress_")) continue;
      const tail = k.slice("audio_progress_".length);
      const val = parseFloat(localStorage.getItem(k) || "0");
      if (val < 8) continue;
      if (!tail.includes("_")) legacy++;
      else chapters++;
    }
  } catch {
    return 0;
  }
  const score = legacy * 8 + chapters * 3;
  return Math.min(100, Math.round(score));
}

export function computeExecutiveStudyPercent(): number {
  try {
    const raw = localStorage.getItem("bc_exec_study_opened");
    if (!raw) return 0;
    const o = JSON.parse(raw) as Record<string, number>;
    const opened = Object.values(o).filter((n) => n > 0).length;
    const total = Math.max(EXECUTIVE_STUDIES.length, 1);
    return Math.min(100, Math.round((100 * opened) / total));
  } catch {
    return 0;
  }
}

export function computeHubCoreMetrics(): HubCoreMetrics {
  return {
    planReading: computePlanReadingPercent(),
    audioExploration: computeAudioExplorationPercent(),
    executiveStudies: computeExecutiveStudyPercent(),
  };
}

/** Leitura / desenvolvimento (formação) por área — valores derivados da atividade guardada localmente. */
export function hubProgressBars(path: string, core: HubCoreMetrics): { reading: number; formation: number } {
  const blend = Math.round((core.planReading + core.executiveStudies + core.audioExploration) / 3);
  switch (path) {
    case "/audios":
      return {
        reading: core.audioExploration,
        formation: Math.max(core.planReading, Math.round((core.executiveStudies + blend) / 2)),
      };
    case "/biblia":
      return {
        reading: Math.max(core.planReading, Math.round((core.planReading + blend) / 2)),
        formation: core.executiveStudies,
      };
    case "/estudos-empresarios":
      return {
        reading: core.executiveStudies,
        formation: Math.max(core.planReading, Math.round((core.audioExploration + core.planReading) / 2)),
      };
    case "/meus-planos":
      return {
        reading: core.planReading,
        formation: Math.max(core.executiveStudies, Math.round((core.audioExploration + blend) / 2)),
      };
    default:
      return { reading: blend, formation: blend };
  }
}
