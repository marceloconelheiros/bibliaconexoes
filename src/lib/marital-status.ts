export const ESTADO_CIVIL_OPTIONS = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "uniao_estavel", label: "União estável" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "prefiro_nao_informar", label: "Prefiro não informar" },
] as const;

export type EstadoCivilSlug = (typeof ESTADO_CIVIL_OPTIONS)[number]["value"];
