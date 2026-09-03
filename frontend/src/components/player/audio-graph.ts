export const EQ_BANDS = [60, 170, 350, 1000, 3500, 10000] as const;

export const EQ_PRESETS: { id: string; label: string; gains: number[] }[] = [
  { id: "flat", label: "Flat", gains: [0, 0, 0, 0, 0, 0] },
  { id: "bass", label: "Bass boost", gains: [7, 5, 2, 0, -1, -2] },
  { id: "treble", label: "Treble boost", gains: [-2, -1, 0, 2, 5, 7] },
  { id: "voice", label: "Voice", gains: [-3, -1, 2, 6, 4, -1] },
  { id: "night", label: "Night", gains: [2, 1, 0, 0, -1, -3] }
];

export type AudioGraph = {
  setDelay: (sec: number) => void;
  setGains: (gains: number[]) => void;
  resume: () => Promise<void>;
};

const graphs = new WeakMap<HTMLMediaElement, AudioGraph>();

export function attachAudioGraph(video: HTMLMediaElement): AudioGraph | null {
  const existing = graphs.get(video);
  if (existing) return existing;
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    const ctx = new Ctor();
    const source = ctx.createMediaElementSource(video);
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0;
    const filters = EQ_BANDS.map((freq) => {
      const filter = ctx.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = freq;
      filter.Q.value = 1.2;
      filter.gain.value = 0;
      return filter;
    });
    source.connect(delay);
    let node: AudioNode = delay;
    for (const filter of filters) {
      node.connect(filter);
      node = filter;
    }
    node.connect(ctx.destination);
    const graph: AudioGraph = {
      setDelay(sec) {
        delay.delayTime.value = Math.max(0, Math.min(2, sec));
      },
      setGains(gains) {
        filters.forEach((filter, index) => {
          filter.gain.value = gains[index] ?? 0;
        });
      },
      resume() {
        return ctx.resume();
      }
    };
    graphs.set(video, graph);
    return graph;
  } catch {
    return null;
  }
}
