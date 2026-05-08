/** Estudos e reflexões com “lente” de liderança, ética e decisão — aparecem ao ler o capítulo correspondente. */

export type ExecutiveStudy = {
  id: string;
  bookAbbrev: string;
  chapter: number;
  title: string;
  lens: string;
  aplicacao: string[];
  perguntas?: string[];
};

export const EXECUTIVE_STUDIES: ExecutiveStudy[] = [
  {
    id: "gn-1",
    bookAbbrev: "Gn",
    chapter: 1,
    title: "Ordem, propósito e “entregar o dia”",
    lens:
      "O relato da criação mostra ritmo: cada etapa tem limite claro e resultado avaliado (“viu que era bom”). Para quem lidera empresas ou equipes, é um convite a definir ciclos de trabalho, revisar entregas e encerrar jornadas — antes de começar o próximo “dia”.",
    aplicacao: [
      "Defina o que significa “bom o suficiente” para cada sprint ou projeto.",
      "Separe planejamento de execução: primeiro estrutura, depois preenchimento.",
      "Reserve tempo para avaliar o dia/semana antes de acumular nova demanda.",
    ],
    perguntas: ["O que está ‘sem forma e vazio’ na sua operação hoje — falta de prioridade ou falta de limite?"],
  },
  {
    id: "gn-12",
    bookAbbrev: "Gn",
    chapter: 12,
    title: "Chamado, incerteza e postura diante do risco",
    lens:
      "Abraão sai sem mapa completo, mas com direção. Negócios exigem dados — também exigem coragem para agir com informação incompleta. O texto equilibra iniciativa com dependência de algo maior que o próprio controle.",
    aplicacao: [
      "Liste o que você já sabe vs. o que só será testado na prática.",
      "Evite confundir cautela com paralisia: um próximo passo pequeno já é diligência.",
      "Alinhe sócios e família sobre o “porquê” da mudança, não só o “quanto”.",
    ],
  },
  {
    id: "ex-18",
    bookAbbrev: "Êx",
    chapter: 18,
    title: "Delegação que escala (Jetro e Moisés)",
    lens:
      "Jetro ensina estrutura: líder não deve ser gargalo de todas as decisões. Capacitar outros com critérios claros libera tempo para o estratégico e reduz burnout — problema clássico de fundadores.",
    aplicacao: [
      "Triagem em níveis: o que só você decide, o que um líder médio decide, o que é rotina.",
      "Documente critérios (“ensinar-lhes”) para reduzir retrabalho.",
      "Meça filas de aprovação: se crescem, o sistema — não só a equipe — precisa mudar.",
    ],
    perguntas: ["Qual decisão você ainda centraliza por hábito, não por necessidade real?"],
  },
  {
    id: "pv-3",
    bookAbbrev: "Pv",
    chapter: 3,
    title: "Confiança, sabedoria e planos de longo prazo",
    lens:
      "Confiar “de todo o coração” não é ausência de planilha — é ordem de prioridades: Deus primeiro orienta metas, relacionamentos e reputação. Para o empresário, traduz-se em compliance interior antes de métricas externas.",
    aplicacao: [
      "Antes de meta financeira, pergunte: isto fortalece ou corrói confiança?",
      "Busque conselho externo (conselho, mentoria, board) antes de pivôs grandes.",
      "Evite “saber demais de si mesmo”: ouça feedback onde dói.",
    ],
  },
  {
    id: "pv-11",
    bookAbbrev: "Pv",
    chapter: 11,
    title: "Integridade, peso da palança e reputação",
    lens:
      "Provérbios 11 trata de pesos justos, discrição e boca que destrói ou edifica. Mercado premia quem é previsível na ética — não só no discurso.",
    aplicacao: [
      "Revise contratos e SLAs: há ambiguidade que favorece só uma parte?",
      "Comunicação: reduza boatos internos com transparência sobre o que é fato.",
      "Generosidade estruturada (sem heroísmo tóxico) constrói redes de confiança.",
    ],
  },
  {
    id: "pv-15",
    bookAbbrev: "Pv",
    chapter: 15,
    title: "Planejamento manso e resposta sob pressão",
    lens:
      "O manso evita explosões que quebram negociações; o ímpio despreza correção. Cultura emocional é ativo — não detalhe de RH.",
    aplicacao: [
      "Em crises, script de comunicação antes da reunião calorosa.",
      "Treine ouvir “não” sem personalizar ataque.",
      "Reconheça erros cedo: custo cai com o tempo.",
    ],
  },
  {
    id: "pv-22",
    bookAbbrev: "Pv",
    chapter: 22,
    title: "Bom nome, dívida e visão de futuro",
    lens:
      "“Melhor é ser humilde com os pobres” confronta ostentação vazia. Crédito e alavancagem exigem margem de segurança — financeira e moral.",
    aplicacao: [
      "Separe crescimento por caixa vs. por alavancagem; saiba o custo real do segundo.",
      "Proteja marca pessoal como ativo: uma crise mal gerida desvaloriza tudo.",
      "Invista em formação e saúde antes que o corpo cobre juros.",
    ],
  },
  {
    id: "ec-3",
    bookAbbrev: "Ec",
    chapter: 3,
    title: "Tempo certo para cada movimento",
    lens:
      "Há época de plantar e de arrancar — também em produtos, pessoas e projetos. Sabedoria é discernimento de timing, não só esforço.",
    aplicacao: [
      "Faça auditoria do que deveria ter sido encerrado há meses.",
      "Em expansão, pergunte: é hora de construir ou de consolidar?",
      "Aceite luto de oportunidades mortas: libera foco.",
    ],
  },
  {
    id: "ec-11",
    bookAbbrev: "Ec",
    chapter: 11,
    title: "Diversificação e humildade diante do que não controlamos",
    lens:
      "Lançar várias “sementes” reconhece incerteza — mas não substitui diligência. Empresário maduro combina experimentação com governança.",
    aplicacao: [
      "Carteira de projetos: nem tudo pode ser “aposta única”.",
      "Defina teto de perda por experimento.",
      "Meteorologia no texto lembra macroeconomia: adapte, não negue.",
    ],
  },
  {
    id: "mt-6",
    bookAbbrev: "Mt",
    chapter: 6,
    title: "Prioridade única e ansiedade na carreira",
    lens:
      "“Buscai primeiro o Reino” reorganiza agenda: segurança última não pode ser só número na conta. Isso não despreza planejamento — reordena fontes de paz.",
    aplicacao: [
      "Limite consumo de métricas que só geram comparação e medo.",
      "Coloque descanso e relacionamentos no calendário como hard commitments.",
      "Pratique “bastará”, não como passividade, como suficiência cotidiana.",
    ],
  },
  {
    id: "mt-25",
    bookAbbrev: "Mt",
    chapter: 25,
    title: "Talentos, responsabilidade e prestação de contas",
    lens:
      "Parábola cobra fidelidade proporcional ao que se recebeu — capital, tempo, equipe. Mediocridade por medo também é risco.",
    aplicacao: [
      "Documente entregas para sócios/investidores com clareza parcial.",
      "Multimplique competências: mentoria interna acelera todos.",
      "“Ao que não prestas serviço” — revise parcerias ociosas.",
    ],
  },
  {
    id: "lc-16",
    bookAbbrev: "Lc",
    chapter: 16,
    title: "Fidelidade no pequeno e língua dos números",
    lens:
      "Jesus une gestão de recursos alheios com coração: quem é negligente no pouco não ganha o muito. Ética em micro decisões escala.",
    aplicacao: [
      "Auditoria de pequenos desvios (notas, horas, comunicações).",
      "Transparência com fornecedores e clientes pequenos também conta.",
      "“Servos de duas senhoras” — confirme se há conflito de lealdades não declarado.",
    ],
  },
  {
    id: "rm-12",
    bookAbbrev: "Rm",
    chapter: 12,
    title: "Mente renovada e discernimento sob pressão",
    lens:
      "“Não vos conformeis” é anti-copypaste de mercado: padronizar pode ser estratégia, mas sem reflexão vira automação moral.",
    aplicacao: [
      "Contraponto: antes de seguir tendência do setor, teste alinhamento com valores declarados.",
      "Humilde na medida realista das próprias funções — sem menos nem mais.",
      "Abençoar quem compete consigo reduz toxicidade interna.",
    ],
  },
  {
    id: "cl-3",
    bookAbbrev: "Cl",
    chapter: 3,
    title: "Trabalho como serviço — dignidade na execução",
    lens:
      "“Fazei de coração… como ao Senhor” eleva o operacional: qualidade deixa de ser só KPI e vira caráter.",
    aplicacao: [
      "Líderes modelam: cliente interno também merece excelência.",
      "Justiça e equidade em folha e promoções.",
      "Castigue toxicidade “para resultados”: cultura é produto de longo prazo.",
    ],
  },
  {
    id: "1tm-6",
    bookAbbrev: "1Tm",
    chapter: 6,
    title: "Contentamento vs. amor ao dinheiro",
    lens:
      "Paulo não demoniza ganho — alerta para confundir meios com fim. Empresário saudável separa identidade de extrato.",
    aplicacao: [
      "Defina \"suficiente\" numérico para reduzir corrida infinita.",
      "\"Riquezas volúveis\": diversifique sentido de segurança.",
      "Generosidade sistemática evita que patrimônio vire ídolo silencioso.",
    ],
  },
];

export function getExecutiveStudy(bookAbbrev: string, chapterOneBased: number): ExecutiveStudy | undefined {
  return EXECUTIVE_STUDIES.find((s) => s.bookAbbrev === bookAbbrev && s.chapter === chapterOneBased);
}
