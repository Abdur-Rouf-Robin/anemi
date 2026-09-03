export type AspectId = "auto" | "4:3" | "16:9" | "16:10" | "185" | "235";
export type CapColor = "white" | "yellow" | "cyan";
export type OnEnded = "next" | "stop" | "replay";
export type FitMode = "contain" | "cover" | "fill";

export const ASPECTS: { id: AspectId; label: string; css?: string }[] = [
  { id: "auto", label: "Original (DAR)" },
  { id: "4:3", label: "4:3", css: "4 / 3" },
  { id: "16:9", label: "16:9", css: "16 / 9" },
  { id: "16:10", label: "16:10", css: "16 / 10" },
  { id: "185", label: "1.85:1", css: "1.85 / 1" },
  { id: "235", label: "2.35:1", css: "2.35 / 1" }
];

export type PlayerTools = {
  hue: number;
  zoom: number;
  panX: number;
  panY: number;
  rotate: 0 | 90 | 180 | 270;
  aspect: AspectId;
  outputPct: number;
  capColor: CapColor;
  capOutline: boolean;
  capBox: boolean;
  capPos: "top" | "bottom";
  capOffset: number;
  capUnder: boolean;
  capFade: boolean;
  rememberPos: boolean;
  seekTip: boolean;
  seekPreview: boolean;
  barMarkers: boolean;
  wakeLock: boolean;
  shuffle: boolean;
  onEnded: OnEnded;
  audioDelay: number;
  eqGains: number[];
  eqOn: boolean;
  touchUi: boolean;
  subMargin: number;
  autoHide: boolean;
};

export const defaultTools: PlayerTools = {
  hue: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
  rotate: 0,
  aspect: "auto",
  outputPct: 100,
  capColor: "white",
  capOutline: true,
  capBox: false,
  capPos: "bottom",
  capOffset: 0,
  capUnder: false,
  capFade: true,
  rememberPos: true,
  seekTip: true,
  seekPreview: false,
  barMarkers: true,
  wakeLock: true,
  shuffle: false,
  onEnded: "next",
  audioDelay: 0,
  eqGains: [0, 0, 0, 0, 0, 0],
  eqOn: false,
  touchUi: false,
  subMargin: 0,
  autoHide: true
};

const KEY = "anemi-player-tools";

export function readTools(): PlayerTools {
  if (typeof window === "undefined") return defaultTools;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "") as Partial<PlayerTools>;
    return { ...defaultTools, ...parsed, eqGains: parsed.eqGains ?? defaultTools.eqGains };
  } catch {
    return defaultTools;
  }
}

export function writeTools(tools: PlayerTools) {
  localStorage.setItem(KEY, JSON.stringify(tools));
}

export function cycleRotate(current: PlayerTools["rotate"]): PlayerTools["rotate"] {
  return ((current + 90) % 360) as PlayerTools["rotate"];
}
