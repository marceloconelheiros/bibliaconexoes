/** Valores gravados em profiles.faith_tradition — ordem amigável ao público brasileiro */
export const FAITH_TRADITION_OPTIONS = [
  { value: "evangelico", label: "Evangélico(a)" },
  { value: "catolico", label: "Católico(a)" },
  { value: "espirita", label: "Espírita (Doutrina Espírita / Kardecismo)" },
  { value: "protestante_historico", label: "Protestante histórico (anglicano, luterano, calvinista etc.)" },
  { value: "ortodoxo", label: "Cristão(ã) ortodoxo(a)" },
  { value: "judaico_messianico", label: "Judaico ou messiânico" },
  { value: "outras_religioes", label: "Outra religião ou caminho espiritual" },
  { value: "sem_religiao", label: "Sem religião específica" },
  { value: "prefiro_nao_informar", label: "Prefiro não informar" },
] as const;

export type FaithTraditionSlug = (typeof FAITH_TRADITION_OPTIONS)[number]["value"];
