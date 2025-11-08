export type DemoPrediction = {
    slug: string;
    name: string;
    confidence: number; // 0-1
    blurb: string;
    why: string[];
    signals: string[];
    risk: string;
    receiptsCount: number;
  };
  
  export const predictions: DemoPrediction[] = [
    {
      slug: "mythic-ai",
      name: "Mythic AI",
      confidence: 0.87,
      blurb: "Founders: ex-OpenAI + Stanford AI Lab",
      why: [
        "14 patents filed in 90 days (3× industry avg)",
        "Hiring 45 engineers across systems + inference",
      ],
      signals: ["MIT $100K win", "Seed + strategic angels"],
      risk: "12% · well-capitalized, strong IP",
      receiptsCount: 1247,
    },
    {
      slug: "neuroflow-systems",
      name: "NeuroFlow Systems",
      confidence: 0.82,
      blurb: "Spinout: Berkeley RISELab",
      why: [
        "3 breakthrough papers · 42 citations in 6 months",
        "DARPA grant targeting distributed inference",
      ],
      signals: ["PIs across systems + safety", "Infra-heavy hires"],
      risk: "28% · technical complexity",
      receiptsCount: 804,
    },
  ];
  
  export const verificationLayer = {
    papers: 247,
    patents: 89,
    grants: 14,
    comps: 23,
    hiring: 870,
    sec: 4,
  };
  
  export const pulseStart = {
    receipts: 2_847_192_441,
    entities: 4_821_774,
    models: 47,
  };
  