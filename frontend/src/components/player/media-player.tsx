"use client";

import {
  Captions,
  Headphones,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Settings,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { useSession } from "@/components/session-provider";
import { api } from "@/lib/client-api";
import type { Preferences } from "@/lib/types";
import { readLocalPrefs, writeLocalPrefs } from "@/lib/prefs";
import { cn, formatClock, audioTrackLabel, captionTrackLabel } from "@/lib/utils";

import { attachAudioGraph, EQ_BANDS, EQ_PRESETS, type AudioGraph } from "./audio-graph";
import { AudioTracksPanel } from "./audio-tracks-panel";
import { CaptionOverlay } from "./caption-overlay";
import { parseCaptions, parseClockInput, cueAt, type Cue } from "./captions";
import { PlayerContextMenu, type PlayerMenuItem } from "./context-menu";
import {
  ASPECTS,
  cycleRotate,
  defaultTools,
  readTools,
  writeTools,
  type PlayerTools
} from "./player-tools";
import { WatchUnderbar } from "./watch-underbar";

export type AudioOption = { kind: "SUB" | "DUB"; href: string; language?: string; label?: string };
export type CaptionOption = { language: string; url: string };
export type PlaylistItem = { id: string; href: string; name: string };

type Quality = { index: number; label: string };

export function MediaPlayer({
  episodeId,
  title,
  episodeName,
  src,
  durationSec,
  introStartSec,
  introEndSec,
  outroStartSec,
  startSec = 0,
  nextHref,
  prevHref,
  audioKind = "SUB",
  audioLanguage = "",
  audioOptions = [],
  subtitleUrl,
  captionOptions = [],
  timeKey,
  persistProgress = true,
  followOnly = false,
  onPlayback,
  videoRef: videoRefProp,
  playlist = [],
  titleId,
  episodeNumber,
  onNavigate
}: {
  episodeId: string;
  title: string;
  episodeName: string;
  src?: string | null;
  durationSec?: number | null;
  introStartSec?: number | null;
  introEndSec?: number | null;
  outroStartSec?: number | null;
  startSec?: number;
  nextHref?: string;
  prevHref?: string;
  audioKind?: "SUB" | "DUB";
  audioLanguage?: string | null;
  audioOptions?: AudioOption[];
  subtitleUrl?: string | null;
  captionOptions?: CaptionOption[];
  timeKey?: string;
  persistProgress?: boolean;
  followOnly?: boolean;
  onPlayback?: (state: { positionSec: number; playing: boolean }) => void;
  videoRef?: RefObject<HTMLVideoElement | null>;
  playlist?: PlaylistItem[];
  titleId?: string;
  episodeNumber?: number;
  onNavigate?: (href: string) => void;
}) {
  const innerVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = videoRefProp ?? innerVideoRef;
  const boxRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<{
    destroy: () => void;
    levels: { height?: number }[];
    currentLevel: number;
    loadSource: (src: string) => void;
    attachMedia: (el: HTMLMediaElement) => void;
    on: (event: string, cb: () => void) => void;
  } | null>(null);
  const router = useRouter();
  const { user } = useSession();
  const viewedRef = useRef(false);
  const [prefs, setPrefs] = useState<Preferences>({
    autoPlay: true,
    autoNext: true,
    autoSkipIntro: true,
    theme: "dark",
    locale: "en"
  });
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSec ?? 0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fs, setFs] = useState(false);
  const [chrome, setChrome] = useState(true);
  const [menu, setMenu] = useState<"none" | "settings" | "keys" | "speed" | "tracks">("none");
  const [captions, setCaptions] = useState(true);
  const [captionLang, setCaptionLang] = useState("");
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [quality, setQuality] = useState(-1);
  const [buffering, setBuffering] = useState(false);
  const [showSkip, setShowSkip] = useState(Boolean(introEndSec));
  const [countdown, setCountdown] = useState<number | null>(null);
  const [theater, setTheater] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [loop, setLoop] = useState(false);
  const [fit, setFit] = useState<"contain" | "cover" | "fill">("contain");
  const [captionSize, setCaptionSize] = useState<"sm" | "md" | "lg">("md");
  const [hideCursor, setHideCursor] = useState(true);
  const [eq, setEq] = useState({ brightness: 1, contrast: 1, saturate: 1, hue: 0 });
  const [ab, setAb] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const [stats, setStats] = useState(false);
  const [tools, setTools] = useState<PlayerTools>(defaultTools);
  const [cues, setCues] = useState<Cue[]>([]);
  const [localCues, setLocalCues] = useState<Cue[] | null>(null);
  const [notice, setNotice] = useState("");
  const [jumpOpen, setJumpOpen] = useState(false);
  const [hoverSeek, setHoverSeek] = useState<{ time: number; x: number } | null>(null);
  const [lightsOff, setLightsOff] = useState(false);
  const lastSent = useRef(0);
  const skippedIntro = useRef(false);
  const hideTimer = useRef<number>(0);
  const loadedSrcRef = useRef("");
  const holdClearRef = useRef<number>(0);
  const episodeReadyRef = useRef(false);
  const [holdFrame, setHoldFrame] = useState<string | null>(null);
  const abRef = useRef(ab);
  abRef.current = ab;
  const toolsRef = useRef(tools);
  toolsRef.current = tools;
  const audioGraphRef = useRef<AudioGraph | null>(null);
  const subFileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    const local = readLocalPrefs();
    setPrefs(local);
    const storedVol = Number(localStorage.getItem("anemi-volume"));
    const storedSpeed = Number(localStorage.getItem("anemi-speed"));
    const storedCap = localStorage.getItem("anemi-captions");
    const storedFit = localStorage.getItem("anemi-fit");
    const storedCapSize = localStorage.getItem("anemi-caption-size");
    if (!Number.isNaN(storedVol) && storedVol >= 0) setVolume(Math.min(1, storedVol));
    if (storedSpeed) setSpeed(storedSpeed);
    if (storedCap === "off") setCaptions(false);
    if (storedFit === "contain" || storedFit === "cover" || storedFit === "fill") setFit(storedFit);
    if (storedCapSize === "sm" || storedCapSize === "md" || storedCapSize === "lg") setCaptionSize(storedCapSize);
    if (localStorage.getItem("anemi-loop") === "on") setLoop(true);
    if (localStorage.getItem("anemi-hide-cursor") === "off") setHideCursor(false);
    try {
      const storedEq = JSON.parse(localStorage.getItem("anemi-eq") || "");
      if (storedEq && typeof storedEq.brightness === "number") {
        setEq({ brightness: storedEq.brightness, contrast: storedEq.contrast ?? 1, saturate: storedEq.saturate ?? 1, hue: storedEq.hue ?? 0 });
      }
    } catch {
      /* ignore */
    }
    setTools(readTools());
  }, []);

  useEffect(() => {
    if (!user) return;
    api<Preferences>("/preferences/me")
      .then(setPrefs)
      .catch(() => undefined);
  }, [user?.id]);

  useEffect(() => {
    viewedRef.current = false;
  }, [episodeId]);

  useEffect(() => {
    if (!playing || viewedRef.current || !episodeId) return;
    viewedRef.current = true;
    void api(`/catalog/episodes/${episodeId}/view`, { method: "POST" }).catch(() => undefined);
  }, [playing, episodeId]);

  const bumpChrome = useCallback(() => {
    setChrome(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (!toolsRef.current.autoHide) return;
      if (videoRef.current && !videoRef.current.paused) setChrome(false);
    }, 2800);
  }, []);

  const go = useCallback(
    (href?: string | null) => {
      if (!href) return;
      if (onNavigate) onNavigate(href);
      else router.push(href);
    },
    [onNavigate, router]
  );

  function captureHold() {
    const node = videoRef.current;
    window.clearTimeout(holdClearRef.current);
    if (!node || node.readyState < 2 || node.videoWidth < 8) {
      setHoldFrame("black");
    } else {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = node.videoWidth;
        canvas.height = node.videoHeight;
        canvas.getContext("2d")?.drawImage(node, 0, 0);
        setHoldFrame(canvas.toDataURL("image/jpeg", 0.7));
      } catch {
        setHoldFrame("black");
      }
    }
    holdClearRef.current = window.setTimeout(() => setHoldFrame(null), 800);
  }

  function releaseHold() {
    window.clearTimeout(holdClearRef.current);
    holdClearRef.current = window.setTimeout(() => setHoldFrame(null), 160);
  }

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !src) return;
    setMediaError("");
    node.volume = muted ? 0 : volume;
    node.playbackRate = speed;
    const same =
      loadedSrcRef.current &&
      (() => {
        try {
          return new URL(loadedSrcRef.current, window.location.origin).href === new URL(src, window.location.origin).href;
        } catch {
          return loadedSrcRef.current === src;
        }
      })();
    if (same) return;
    if (loadedSrcRef.current) captureHold();
    setBuffering(true);
    hlsRef.current?.destroy();
    hlsRef.current = null;
    loadedSrcRef.current = src;
    const ready = () => {
      const levels = hlsRef.current?.levels ?? [];
      setQualities(
        levels
          .map((level, index) => ({ index, label: level.height ? `${level.height}p` : `Q${index + 1}` }))
          .reverse()
      );
    };
    if (src.includes(".m3u8")) {
      void import("hls.js").then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const instance = new Hls({ capLevelToPlayerSize: true });
          instance.loadSource(src);
          instance.attachMedia(node);
          instance.on(Hls.Events.MANIFEST_PARSED, ready);
          hlsRef.current = instance as NonNullable<typeof hlsRef.current>;
        } else if (node.canPlayType("application/vnd.apple.mpegurl")) {
          node.src = src;
          node.addEventListener("loadedmetadata", ready, { once: true });
        }
      });
    } else {
      node.src = src;
      node.addEventListener("loadedmetadata", ready, { once: true });
    }
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    skippedIntro.current = false;
    setCountdown(null);
    setShowSkip(Boolean(introEndSec));
    const node = videoRef.current;
    if (!node || !src) return;
    const switched = episodeReadyRef.current;
    episodeReadyRef.current = true;
    if (switched) captureHold();
    let start = startSec;
    if (timeKey && start < 2 && readTools().rememberPos) {
      const saved = Number(sessionStorage.getItem(`anemi-t-${timeKey}`));
      if (saved > 2) start = saved;
    }
    const apply = () => {
      const target = start > 2 ? start : 0;
      if (Number.isFinite(node.duration) && node.duration > 0) {
        if (Math.abs(node.currentTime - target) < 0.2) {
          releaseHold();
          return;
        }
        node.currentTime = Math.min(target, Math.max(0, node.duration - 0.05));
      }
    };
    if (node.readyState >= 1) apply();
    else node.addEventListener("loadedmetadata", apply, { once: true });
  }, [episodeId]);

  useEffect(() => {
    const node = videoRef.current;
    if (node) node.playbackRate = speed;
    localStorage.setItem("anemi-speed", String(speed));
  }, [speed]);

  useEffect(() => {
    const node = videoRef.current;
    if (node) node.volume = muted ? 0 : volume;
    localStorage.setItem("anemi-volume", String(volume));
  }, [volume, muted]);

  useEffect(() => {
    localStorage.setItem("anemi-captions", captions ? "on" : "off");
    const track = videoRef.current?.textTracks[0];
    if (track) track.mode = "hidden";
  }, [captions, subtitleUrl]);

  useEffect(() => {
    localStorage.setItem("anemi-loop", loop ? "on" : "off");
  }, [loop]);

  useEffect(() => {
    localStorage.setItem("anemi-fit", fit);
  }, [fit]);

  useEffect(() => {
    localStorage.setItem("anemi-caption-size", captionSize);
  }, [captionSize]);

  useEffect(() => {
    localStorage.setItem("anemi-hide-cursor", hideCursor ? "on" : "off");
  }, [hideCursor]);

  useEffect(() => {
    localStorage.setItem("anemi-eq", JSON.stringify(eq));
  }, [eq]);

  useEffect(() => {
    writeTools(tools);
    audioGraphRef.current?.setDelay(tools.audioDelay);
    audioGraphRef.current?.setGains(tools.eqOn ? tools.eqGains : [0, 0, 0, 0, 0, 0]);
  }, [tools]);

  const captionSignature = captionOptions.map((item) => `${item.language}:${item.url}`).join("|");
  useEffect(() => {
    const saved = localStorage.getItem("anemi-caption-lang");
    const match = captionOptions.find((item) => item.language === saved) ?? captionOptions[0];
    setCaptionLang(match?.language ?? "");
  }, [captionSignature, captionOptions]);

  const captionSrc = captionOptions.find((item) => item.language === captionLang)?.url ?? subtitleUrl;

  useEffect(() => {
    if (!captionSrc) {
      setCues([]);
      return;
    }
    let gone = false;
    fetch(captionSrc)
      .then((res) => res.text())
      .then((text) => {
        if (!gone) setCues(parseCaptions(text));
      })
      .catch(() => {
        if (!gone) setCues([]);
      });
    return () => {
      gone = true;
    };
  }, [captionSrc]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !src) return;
    const graph = attachAudioGraph(node);
    audioGraphRef.current = graph;
    graph?.setDelay(toolsRef.current.audioDelay);
    graph?.setGains(toolsRef.current.eqOn ? toolsRef.current.eqGains : [0, 0, 0, 0, 0, 0]);
  }, [src]);

  useEffect(() => {
    if (!tools.wakeLock || !playing) {
      void wakeLockRef.current?.release().catch(() => undefined);
      wakeLockRef.current = null;
      return;
    }
    const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } };
    void nav.wakeLock
      ?.request("screen")
      .then((lock) => {
        wakeLockRef.current = lock;
      })
      .catch(() => undefined);
    return () => {
      void wakeLockRef.current?.release().catch(() => undefined);
      wakeLockRef.current = null;
    };
  }, [tools.wakeLock, playing]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("anemi-theater", { detail: theater }));
  }, [theater]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("anemi-lights", { detail: lightsOff }));
  }, [lightsOff]);

  useEffect(() => {
    function onPrefs() {
      setPrefs(readLocalPrefs());
    }
    window.addEventListener("anemi-prefs", onPrefs);
    return () => window.removeEventListener("anemi-prefs", onPrefs);
  }, []);

  useEffect(() => {
    if (countdown == null || !nextHref) return;
    if (countdown <= 0) {
      go(nextHref);
      return;
    }
    const id = window.setTimeout(() => setCountdown((value) => (value == null ? null : value - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [countdown, nextHref, go]);

  function reportPlayback() {
    const node = videoRef.current;
    if (!node || !onPlayback) return;
    onPlayback({ positionSec: Math.floor(node.currentTime), playing: !node.paused });
  }

  async function persist(completed = false) {
    const node = videoRef.current;
    if (!persistProgress || followOnly || !node?.duration) return;
    if (!toolsRef.current.rememberPos) return;
    const now = Date.now();
    if (!completed && now - lastSent.current < 5000) return;
    lastSent.current = now;
    if (timeKey) sessionStorage.setItem(`anemi-t-${timeKey}`, String(Math.floor(node.currentTime)));
    try {
      await api("/library/progress", {
        method: "PUT",
        body: JSON.stringify({
          episodeId,
          positionSec: Math.floor(node.currentTime),
          durationSec: Math.floor(node.duration || durationSec || 1),
          completed
        })
      });
    } catch {
      /* guest */
    }
  }

  function seek(to: number) {
    const node = videoRef.current;
    if (!node) return;
    node.currentTime = Math.max(0, Math.min(node.duration || duration, to));
  }

  function togglePlay() {
    const node = videoRef.current;
    if (!node || mediaError) return;
    if (node.paused) {
      void node.play().catch(() => {
        setMediaError("This file cannot play. Upload an MP4 you own or license in admin.");
      });
      void audioGraphRef.current?.resume();
    } else node.pause();
    bumpChrome();
  }

  function toggleFs() {
    const box = boxRef.current;
    if (!box) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void box.requestFullscreen();
  }

  function togglePiP() {
    const node = videoRef.current;
    if (!node || !document.pictureInPictureEnabled) return;
    if (document.pictureInPictureElement) void document.exitPictureInPicture();
    else void node.requestPictureInPicture();
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* ignore */
    }
  }

  function switchAudio(href: string) {
    const node = videoRef.current;
    if (node && timeKey) sessionStorage.setItem(`anemi-t-${timeKey}`, String(Math.floor(node.currentTime)));
    go(href);
  }

  function bumpEq(key: "brightness" | "contrast" | "saturate" | "hue", delta: number) {
    setEq((prev) => {
      if (key === "hue") return { ...prev, hue: Math.max(-180, Math.min(180, prev.hue + delta * 100)) };
      return { ...prev, [key]: Math.max(0.2, Math.min(2, +(prev[key] + delta).toFixed(2))) };
    });
  }

  function patchTools(partial: Partial<PlayerTools>) {
    setTools((prev) => ({ ...prev, ...partial }));
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1600);
  }

  function playNext() {
    if (toolsRef.current.shuffle && playlist.length > 1) {
      const rest = playlist.filter((item) => item.id !== episodeId);
      const pick = rest[Math.floor(Math.random() * rest.length)];
      if (pick) {
        go(pick.href);
        return;
      }
    }
    if (nextHref) go(nextHref);
  }

  async function screenshot() {
    const node = videoRef.current;
    if (!node) return;
    const canvas = document.createElement("canvas");
    canvas.width = node.videoWidth || 1280;
    canvas.height = node.videoHeight || 720;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    ctx2d.filter = `brightness(${eq.brightness}) contrast(${eq.contrast}) saturate(${eq.saturate}) hue-rotate(${eq.hue}deg)`;
    ctx2d.drawImage(node, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${title.replace(/\s+/g, "-")}-${formatClock(current).replace(":", "-")}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
      flash("Saved screenshot");
    });
  }

  async function loadSubtitleFile(file?: File | null) {
    if (!file) return;
    const text = await file.text();
    setLocalCues(parseCaptions(text));
    setCaptions(true);
    flash(`Loaded ${file.name}`);
  }

  async function openClipboard() {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      const url = new URL(text, window.location.origin);
      if (url.pathname.startsWith("/watch/")) {
        go(url.pathname);
        return;
      }
      flash("Clipboard is not a watch link");
    } catch {
      flash("Could not read clipboard");
    }
  }

  function reopen() {
    const node = videoRef.current;
    if (!node || !src) return;
    const t = node.currentTime;
    node.load();
    node.currentTime = t;
    void node.play().catch(() => undefined);
    flash("Reloaded");
  }

  function resetPicture() {
    setEq({ brightness: 1, contrast: 1, saturate: 1, hue: 0 });
    patchTools({ zoom: 1, panX: 0, panY: 0, rotate: 0, aspect: "auto", subMargin: 0 });
    setFit("contain");
  }

  async function toggleLater() {
    if (!titleId) {
      flash("Sign in to save");
      return;
    }
    try {
      await api(`/library/later/${titleId}`, { method: "PUT" });
      flash("Updated watch later");
    } catch {
      router.push("/account");
    }
  }

  async function toggleFollow() {
    if (!titleId) {
      flash("Sign in to follow");
      return;
    }
    try {
      await api(`/library/follow/${titleId}`, { method: "PUT" });
      flash("Updated following");
    } catch {
      router.push("/account");
    }
  }

  function copyCue() {
    const active = cueAt(localCues ?? cues, current + tools.capOffset);
    if (!active) {
      flash("No caption on screen");
      return;
    }
    void copyText(active.text);
    flash("Copied caption");
  }

  const closeCtx = useCallback(() => setCtx(null), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const node = videoRef.current;
      if (!node) return;
      const key = event.key.toLowerCase();
      if (key === " " || key === "k") {
        event.preventDefault();
        togglePlay();
      } else if (key === "arrowleft" || key === "j") seek(node.currentTime - 10);
      else if (key === "arrowright" || key === "l") seek(node.currentTime + 10);
      else if (key === "arrowup") {
        event.preventDefault();
        setVolume((v) => Math.min(1, v + 0.1));
        setMuted(false);
      } else if (key === "arrowdown") {
        event.preventDefault();
        setVolume((v) => Math.max(0, v - 0.1));
      } else if (key === "f") toggleFs();
      else if (key === "m") setMuted((v) => !v);
      else if (key === "c") setCaptions((v) => !v);
      else if (key === "n" && nextHref) go(nextHref);
      else if (key === "p" && prevHref) go(prevHref);
      else if (key === "t") setTheater((v) => !v);
      else if (key === "?" || (event.shiftKey && key === "/")) setMenu((v) => (v === "keys" ? "none" : "keys"));
      else if (key >= "0" && key <= "9" && node.duration) seek((node.duration * Number(key)) / 10);
    }
    window.addEventListener("keydown", onKey);
    function onFs() {
      setFs(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [nextHref, prevHref, go]);

  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-black text-center ring-1 ring-white/10">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted uppercase">Not available yet</p>
          <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted">{episodeName}</p>
          <p className="mx-auto mt-3 max-w-sm text-xs text-muted">
            This episode has no licensed file. Staff rsync into the inbox, import, encode, then publish.
          </p>
        </div>
      </div>
    );
  }

  const pct = duration ? (current / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;
  const introFrom = introStartSec ?? 0;
  const inIntro = Boolean(
    introEndSec && current > 0.4 && current >= introFrom && current < introEndSec
  );
  const nearOutro = Boolean(
    outroStartSec ? current >= outroStartSec : duration && current > duration - 25
  );

  const hasCues = Boolean((localCues ?? cues).length || captionSrc || captionOptions.length);

  function patchPref(key: "autoPlay" | "autoNext" | "autoSkipIntro") {
    const next = { [key]: !prefs[key] };
    setPrefs((prev) => {
      const merged = { ...prev, ...next };
      writeLocalPrefs(merged);
      return merged;
    });
    void api("/preferences", { method: "PUT", body: JSON.stringify(next) }).catch(() => undefined);
  }

  const menuItems: PlayerMenuItem[] = [
    {
      id: "open",
      label: "Open",
      children: [
        { id: "load-sub", label: "Load subtitle file…", run: () => subFileRef.current?.click() },
        { id: "reload-sub", label: "Reload episode captions", disabled: !subtitleUrl, run: () => { setLocalCues(null); flash("Episode captions"); } },
        { id: "open-clip", label: "Open watch link from clipboard", run: () => void openClipboard() },
        { id: "reopen", label: "Reload current video", run: reopen }
      ]
    },
    {
      id: "playback",
      label: "Playback",
      children: [
        { id: "play", label: playing ? "Pause" : "Play", hint: "K", run: togglePlay },
        { id: "prev", label: "Previous episode", hint: "P", disabled: !prevHref, run: () => prevHref && go(prevHref) },
        { id: "next", label: "Next episode", hint: "N", disabled: !nextHref && playlist.length < 2, run: playNext },
        {
          id: "jump",
          label: "Jump to",
          children: [
            { id: "jump-time", label: "Jump to time…", run: () => setJumpOpen(true) },
            ...[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((pctJump) => ({
              id: `jump-${pctJump}`,
              label: `${pctJump}%`,
              run: () => duration && seek((duration * pctJump) / 100)
            })),
            { id: "jump-intro", label: "Jump to after intro", disabled: !introEndSec, run: () => introEndSec && seek(introEndSec) },
            { id: "jump-outro", label: "Jump to ending", disabled: !outroStartSec, run: () => outroStartSec && seek(outroStartSec) }
          ]
        },
        { id: "back", label: "Skip back 10s", hint: "J", run: () => seek(current - 10) },
        { id: "fwd", label: "Skip forward 10s", hint: "L", run: () => seek(current + 10) },
        {
          id: "speed-menu",
          label: "Speed",
          children: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => ({
            id: `speed-${rate}`,
            label: `${rate}×`,
            checked: speed === rate,
            keepOpen: true,
            run: () => setSpeed(rate)
          }))
        },
        { id: "loop", label: "Repeat this episode", checked: loop, keepOpen: true, run: () => setLoop((v) => !v) },
        {
          id: "ab",
          label: "A–B repeat",
          children: [
            { id: "mark-a", label: ab.a == null ? "Mark A" : `A at ${formatClock(ab.a)}`, keepOpen: true, run: () => setAb((prev) => ({ ...prev, a: current })) },
            { id: "mark-b", label: ab.b == null ? "Mark B" : `B at ${formatClock(ab.b)}`, disabled: ab.a == null, keepOpen: true, run: () => setAb((prev) => ({ ...prev, b: current })) },
            { id: "clear-ab", label: "Clear A–B", disabled: ab.a == null && ab.b == null, keepOpen: true, run: () => setAb({ a: null, b: null }) }
          ]
        },
        { id: "shuffle", label: "Shuffle next episode", checked: tools.shuffle, keepOpen: true, run: () => patchTools({ shuffle: !tools.shuffle }) },
        { id: "remember", label: "Remember playback position", checked: tools.rememberPos, keepOpen: true, run: () => patchTools({ rememberPos: !tools.rememberPos }) },
        { id: "hide-cursor", label: "Hide cursor during playback", checked: hideCursor, keepOpen: true, run: () => setHideCursor((v) => !v) },
        { id: "wake", label: "Prevent screen sleep", checked: tools.wakeLock, keepOpen: true, run: () => patchTools({ wakeLock: !tools.wakeLock }) },
        { id: "seek-tip", label: "Show time tooltip when seeking", checked: tools.seekTip, keepOpen: true, run: () => patchTools({ seekTip: !tools.seekTip }) },
        { id: "markers", label: "Show intro/ending markers", checked: tools.barMarkers, keepOpen: true, run: () => patchTools({ barMarkers: !tools.barMarkers }) },
        { id: "autoplay", label: "Auto play", checked: prefs.autoPlay, keepOpen: true, run: () => patchPref("autoPlay") },
        { id: "autonext", label: "Auto next", checked: prefs.autoNext, keepOpen: true, run: () => patchPref("autoNext") },
        { id: "skipintro", label: "Auto skip intro", checked: prefs.autoSkipIntro, keepOpen: true, run: () => patchPref("autoSkipIntro") }
      ]
    },
    {
      id: "subtitles",
      label: "Subtitles",
      children: [
        { id: "cap-toggle", label: captions ? "Hide captions" : "Show captions", hint: "C", disabled: !hasCues, checked: captions && hasCues, keepOpen: true, run: () => setCaptions((v) => !v) },
        ...(captionOptions.length
          ? captionOptions.map((track) => ({
              id: `cap-lang-${track.language}-${track.url}`,
              label: captionTrackLabel(track.language),
              checked: captions && captionLang === track.language,
              keepOpen: true,
              run: () => {
                setCaptions(true);
                setCaptionLang(track.language);
                localStorage.setItem("anemi-caption-lang", track.language);
              }
            }))
          : []),
        { id: "cap-copy", label: "Copy current caption", disabled: !hasCues, run: copyCue },
        { id: "cap-load", label: "Load subtitle file…", run: () => subFileRef.current?.click() },
        {
          id: "cap-size",
          label: "Caption size",
          children: [
            { id: "cap-sm", label: "Small", checked: captionSize === "sm", keepOpen: true, run: () => setCaptionSize("sm") },
            { id: "cap-md", label: "Medium", checked: captionSize === "md", keepOpen: true, run: () => setCaptionSize("md") },
            { id: "cap-lg", label: "Large", checked: captionSize === "lg", keepOpen: true, run: () => setCaptionSize("lg") }
          ]
        },
        {
          id: "cap-style",
          label: "Caption style",
          children: [
            { id: "col-w", label: "White", checked: tools.capColor === "white", keepOpen: true, run: () => patchTools({ capColor: "white" }) },
            { id: "col-y", label: "Yellow", checked: tools.capColor === "yellow", keepOpen: true, run: () => patchTools({ capColor: "yellow" }) },
            { id: "col-c", label: "Cyan", checked: tools.capColor === "cyan", keepOpen: true, run: () => patchTools({ capColor: "cyan" }) },
            { id: "cap-outline", label: "Outline", checked: tools.capOutline, keepOpen: true, run: () => patchTools({ capOutline: !tools.capOutline }) },
            { id: "cap-box", label: "Opaque box", checked: tools.capBox, keepOpen: true, run: () => patchTools({ capBox: !tools.capBox }) },
            { id: "cap-fade", label: "Fade in/out", checked: tools.capFade, keepOpen: true, run: () => patchTools({ capFade: !tools.capFade }) }
          ]
        },
        {
          id: "cap-pos",
          label: "Caption position",
          children: [
            { id: "pos-b", label: "Inside video (bottom)", checked: !tools.capUnder && tools.capPos === "bottom", keepOpen: true, run: () => patchTools({ capUnder: false, capPos: "bottom" }) },
            { id: "pos-t", label: "Inside video (top)", checked: !tools.capUnder && tools.capPos === "top", keepOpen: true, run: () => patchTools({ capUnder: false, capPos: "top" }) },
            { id: "pos-u", label: "Under the video", checked: tools.capUnder, keepOpen: true, run: () => patchTools({ capUnder: true }) }
          ]
        },
        {
          id: "cap-sync",
          label: `Sync (${tools.capOffset >= 0 ? "+" : ""}${tools.capOffset.toFixed(1)}s)`,
          children: [
            { id: "sync-m", label: "Delay captions −0.5s", keepOpen: true, run: () => patchTools({ capOffset: +(tools.capOffset - 0.5).toFixed(1) }) },
            { id: "sync-p", label: "Delay captions +0.5s", keepOpen: true, run: () => patchTools({ capOffset: +(tools.capOffset + 0.5).toFixed(1) }) },
            { id: "sync-0", label: "Reset sync", keepOpen: true, run: () => patchTools({ capOffset: 0 }) }
          ]
        },
        { id: "cap-margin", label: `Bottom margin (${tools.subMargin}px)`, keepOpen: true, run: () => patchTools({ subMargin: tools.subMargin >= 80 ? 0 : tools.subMargin + 20 }) }
      ]
    },
    {
      id: "audio",
      label: "Audio",
      children: [
        ...(audioOptions.length > 1
          ? audioOptions.map((option) => ({
              id: `audio-${option.kind}-${option.language ?? ""}-${option.href}`,
              label: option.label ?? audioTrackLabel(option.kind, option.language),
              checked: option.kind === audioKind && (option.language ?? "") === (audioLanguage ?? ""),
              run: () => switchAudio(option.href)
            }))
          : [{ id: "audio-only", label: audioKind === "DUB" ? "This file is Dub" : "This file is Original (Sub)", disabled: true }]),
        { id: "tracks-panel", label: "Audio & Subtitles panel", run: () => setMenu("tracks") },
        { id: "mute", label: muted ? "Unmute" : "Mute", hint: "M", keepOpen: true, run: () => setMuted((v) => !v) },
        { id: "vol-up", label: `Volume + (${Math.round((muted ? 0 : volume) * 100)}%)`, keepOpen: true, run: () => { setMuted(false); setVolume((v) => Math.min(1, v + 0.1)); } },
        { id: "vol-down", label: "Volume −", keepOpen: true, run: () => setVolume((v) => Math.max(0, v - 0.1)) },
        {
          id: "adelay",
          label: `Audio delay (${Math.round(tools.audioDelay * 1000)} ms)`,
          children: [
            { id: "adelay-m", label: "−100 ms", keepOpen: true, run: () => patchTools({ audioDelay: Math.max(0, +(tools.audioDelay - 0.1).toFixed(2)) }) },
            { id: "adelay-p", label: "+100 ms", keepOpen: true, run: () => patchTools({ audioDelay: Math.min(2, +(tools.audioDelay + 0.1).toFixed(2)) }) },
            { id: "adelay-0", label: "Reset delay", keepOpen: true, run: () => patchTools({ audioDelay: 0 }) }
          ]
        },
        {
          id: "eq",
          label: "Equalizer",
          children: [
            { id: "eq-on", label: tools.eqOn ? "Equalizer on" : "Equalizer off", checked: tools.eqOn, keepOpen: true, run: () => patchTools({ eqOn: !tools.eqOn }) },
            ...EQ_PRESETS.map((preset) => ({
              id: `eq-${preset.id}`,
              label: preset.label,
              checked: tools.eqOn && preset.gains.every((gain, i) => gain === (tools.eqGains[i] ?? 0)),
              keepOpen: true,
              run: () => patchTools({ eqOn: true, eqGains: [...preset.gains] })
            })),
            ...EQ_BANDS.map((freq, index) => ({
              id: `eq-b-${freq}`,
              label: `${freq} Hz  ${tools.eqGains[index] >= 0 ? "+" : ""}${tools.eqGains[index]} dB`,
              keepOpen: true,
              run: () =>
                patchTools({
                  eqOn: true,
                  eqGains: tools.eqGains.map((gain, i) => (i === index ? Math.min(12, gain + 1) : gain))
                })
            })),
            {
              id: "eq-cut",
              label: "Lower last band",
              keepOpen: true,
              run: () =>
                patchTools({
                  eqGains: tools.eqGains.map((gain, i) => (i === tools.eqGains.length - 1 ? Math.max(-12, gain - 1) : gain))
                })
            }
          ]
        }
      ]
    },
    {
      id: "video",
      label: "Video",
      children: [
        { id: "eq-reset", label: "Reset color", keepOpen: true, disabled: eq.brightness === 1 && eq.contrast === 1 && eq.saturate === 1 && eq.hue === 0, run: () => setEq({ brightness: 1, contrast: 1, saturate: 1, hue: 0 }) },
        { id: "br-up", label: `Brightness + (${Math.round(eq.brightness * 100)}%)`, keepOpen: true, run: () => bumpEq("brightness", 0.05) },
        { id: "br-dn", label: "Brightness −", keepOpen: true, run: () => bumpEq("brightness", -0.05) },
        { id: "ct-up", label: `Contrast + (${Math.round(eq.contrast * 100)}%)`, keepOpen: true, run: () => bumpEq("contrast", 0.05) },
        { id: "ct-dn", label: "Contrast −", keepOpen: true, run: () => bumpEq("contrast", -0.05) },
        { id: "sat-up", label: `Saturation + (${Math.round(eq.saturate * 100)}%)`, keepOpen: true, run: () => bumpEq("saturate", 0.05) },
        { id: "sat-dn", label: "Saturation −", keepOpen: true, run: () => bumpEq("saturate", -0.05) },
        { id: "hue-up", label: `Hue + (${Math.round(eq.hue)}°)`, keepOpen: true, run: () => bumpEq("hue", 0.1) },
        { id: "hue-dn", label: "Hue −", keepOpen: true, run: () => bumpEq("hue", -0.1) },
        { id: "rotate", label: `Rotate (${tools.rotate}°)`, keepOpen: true, run: () => patchTools({ rotate: cycleRotate(tools.rotate) }) },
        { id: "shot", label: "Save screenshot", run: () => void screenshot() },
        ...(qualities.length
          ? [
              { id: "q-auto", label: "Quality auto", checked: quality === -1, keepOpen: true, run: () => { setQuality(-1); if (hlsRef.current) hlsRef.current.currentLevel = -1; } },
              ...qualities.map((item) => ({
                id: `q-${item.index}`,
                label: `Quality ${item.label}`,
                checked: quality === item.index,
                keepOpen: true,
                run: () => {
                  setQuality(item.index);
                  if (hlsRef.current) hlsRef.current.currentLevel = item.index;
                }
              }))
            ]
          : [])
      ]
    },
    {
      id: "frame",
      label: "Frame size",
      children: [
        { id: "zoom-in", label: "Zoom in", keepOpen: true, run: () => patchTools({ zoom: Math.min(4, +(tools.zoom + 0.1).toFixed(2)) }) },
        { id: "zoom-out", label: "Zoom out", keepOpen: true, run: () => patchTools({ zoom: Math.max(0.5, +(tools.zoom - 0.1).toFixed(2)) }) },
        { id: "zoom-1", label: "Actual size (1×)", checked: tools.zoom === 1 && tools.panX === 0 && tools.panY === 0, keepOpen: true, run: () => patchTools({ zoom: 1, panX: 0, panY: 0 }) },
        { id: "pan-l", label: "Move left", keepOpen: true, run: () => patchTools({ panX: tools.panX - 24 }) },
        { id: "pan-r", label: "Move right", keepOpen: true, run: () => patchTools({ panX: tools.panX + 24 }) },
        { id: "pan-u", label: "Move up", keepOpen: true, run: () => patchTools({ panY: tools.panY - 24 }) },
        { id: "pan-d", label: "Move down", keepOpen: true, run: () => patchTools({ panY: tools.panY + 24 }) },
        { id: "reset-frame", label: "Reset frame", keepOpen: true, run: resetPicture }
      ]
    },
    {
      id: "aspect",
      label: "Aspect ratio",
      children: [
        { id: "fit-contain", label: "Keep aspect ratio", checked: fit === "contain" && tools.aspect === "auto", keepOpen: true, run: () => { setFit("contain"); patchTools({ aspect: "auto" }); } },
        { id: "fit-cover", label: "Fill (crop)", checked: fit === "cover", keepOpen: true, run: () => setFit("cover") },
        { id: "fit-fill", label: "Stretch", checked: fit === "fill", keepOpen: true, run: () => setFit("fill") },
        ...ASPECTS.map((item) => ({
          id: `ar-${item.id}`,
          label: item.label,
          checked: tools.aspect === item.id,
          keepOpen: true,
          run: () => {
            patchTools({ aspect: item.id });
            setFit("contain");
          }
        }))
      ]
    },
    {
      id: "window",
      label: "Window size",
      children: [
        { id: "fs", label: fs ? "Exit fullscreen" : "Fullscreen (keep AR)", hint: "F", run: () => { setFit("contain"); toggleFs(); } },
        { id: "fs-stretch", label: "Fullscreen (stretch)", run: () => { setFit("fill"); if (!document.fullscreenElement) toggleFs(); } },
        { id: "theater", label: theater ? "Exit theater" : "Theater (maximize in page)", hint: "T", run: () => setTheater((v) => !v) },
        { id: "pip", label: "Picture in picture (stay on top)", run: togglePiP },
        { id: "sz-50", label: "50% player size", checked: tools.outputPct === 50, keepOpen: true, run: () => patchTools({ outputPct: 50 }) },
        { id: "sz-75", label: "75% player size", checked: tools.outputPct === 75, keepOpen: true, run: () => patchTools({ outputPct: 75 }) },
        { id: "sz-100", label: "100% player size", checked: tools.outputPct === 100, keepOpen: true, run: () => patchTools({ outputPct: 100 }) },
        { id: "sz-up", label: "Increase player size", keepOpen: true, run: () => patchTools({ outputPct: Math.min(100, tools.outputPct + 10) }) },
        { id: "sz-dn", label: "Decrease player size", keepOpen: true, run: () => patchTools({ outputPct: Math.max(40, tools.outputPct - 10) }) }
      ]
    },
    {
      id: "album",
      label: "Album / Favorites",
      children: [
        { id: "later", label: "Add / remove Watch later", disabled: !titleId, run: () => void toggleLater() },
        { id: "follow", label: "Follow / unfollow title", disabled: !titleId, run: () => void toggleFollow() },
        { id: "lib", label: "Open library", run: () => router.push("/library") },
        ...(playlist.length
          ? [
              {
                id: "plist",
                label: "Playlist",
                children: playlist.slice(0, 24).map((item) => ({
                  id: `pl-${item.id}`,
                  label: item.name,
                  checked: item.id === episodeId,
                  run: () => item.id !== episodeId && go(item.href)
                }))
              }
            ]
          : [])
      ]
    },
    {
      id: "tools",
      label: "Tools",
      children: [
        { id: "shot2", label: "Screenshot", run: () => void screenshot() },
        { id: "pip2", label: "Picture in picture", run: togglePiP },
        { id: "stats2", label: stats ? "Hide playback info" : "Show playback info", run: () => setStats((v) => !v) },
        { id: "copy-time", label: "Copy current time", run: () => { void copyText(formatClock(current)); flash("Copied time"); } },
        { id: "copy-url", label: "Copy watch link", run: () => { void copyText(window.location.href); flash("Copied link"); } }
      ]
    },
    {
      id: "filters",
      label: "Filters",
      children: [
        { id: "browser-dec", label: "Browser video decoder", checked: true, disabled: true },
        { id: "web-audio", label: "Built-in audio equalizer", checked: tools.eqOn, keepOpen: true, run: () => patchTools({ eqOn: !tools.eqOn }) }
      ]
    },
    {
      id: "skins",
      label: "Skins",
      children: [
        { id: "auto-hide", label: "Auto-hide controls while playing", checked: tools.autoHide, keepOpen: true, run: () => patchTools({ autoHide: !tools.autoHide }) },
        { id: "touch", label: "Larger touch controls", checked: tools.touchUi, keepOpen: true, run: () => patchTools({ touchUi: !tools.touchUi }) },
        { id: "theme", label: "Site theme (Settings)", run: () => router.push("/settings") }
      ]
    },
    {
      id: "misc",
      label: "Misc",
      children: [
        { id: "end-next", label: "When finished: play next", checked: tools.onEnded === "next", keepOpen: true, run: () => patchTools({ onEnded: "next" }) },
        { id: "end-stop", label: "When finished: stop", checked: tools.onEnded === "stop", keepOpen: true, run: () => patchTools({ onEnded: "stop" }) },
        { id: "end-replay", label: "When finished: replay", checked: tools.onEnded === "replay", keepOpen: true, run: () => patchTools({ onEnded: "replay" }) },
        { id: "keys", label: "Keyboard shortcuts", hint: "?", run: () => setMenu("keys") },
        { id: "settings-page", label: "Player settings page", run: () => router.push("/settings") }
      ]
    },
    { id: "sep-1", label: "" },
    { id: "fs-main", label: fs ? "Exit fullscreen" : "Fullscreen", hint: "F", run: toggleFs }
  ];

  const qualityLabel =
    quality >= 0 ? (qualities.find((item) => item.index === quality)?.label ?? "HD") : qualities.length ? "Auto" : "HD";

  return (
    <div
      className="min-w-0"
      style={{ width: fs || tools.outputPct >= 100 ? undefined : `${tools.outputPct}%`, marginInline: "auto" }}
    >
    <div
      ref={boxRef}
      className={cn(
        "group relative overflow-hidden rounded-lg bg-black ring-1 ring-white/10",
        `caption-${captionSize}`,
        hideCursor && !chrome && playing && "cursor-none",
        tools.touchUi && "[&_button]:min-h-10 [&_button]:min-w-10"
      )}
      onMouseMove={bumpChrome}
      onMouseLeave={() => playing && tools.autoHide && setChrome(false)}
      onContextMenu={(event) => {
        event.preventDefault();
        setMenu("none");
        setCtx({ x: event.clientX, y: event.clientY });
      }}
    >
      <div
        className="relative aspect-video w-full overflow-hidden bg-black"
        style={{ paddingBottom: tools.subMargin || undefined }}
        onPointerDown={(event) => {
          if (tools.zoom <= 1) return;
          (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
          dragRef.current = { x: event.clientX, y: event.clientY, panX: tools.panX, panY: tools.panY, moved: false };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag) return;
          const dx = event.clientX - drag.x;
          const dy = event.clientY - drag.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
          patchTools({ panX: drag.panX + dx, panY: drag.panY + dy });
        }}
        onPointerUp={() => {
          if (dragRef.current?.moved) {
            window.setTimeout(() => {
              dragRef.current = null;
            }, 0);
          } else {
            dragRef.current = null;
          }
        }}
      >
      <video
        ref={videoRef}
        className={cn(
          "h-full w-full bg-black",
          fit === "contain" && "object-contain",
          fit === "cover" && "object-cover",
          fit === "fill" && "object-fill"
        )}
        style={{
          filter: `brightness(${eq.brightness}) contrast(${eq.contrast}) saturate(${eq.saturate}) hue-rotate(${eq.hue}deg)`,
          aspectRatio: ASPECTS.find((item) => item.id === tools.aspect)?.css,
          transform: `translate(${tools.panX}px, ${tools.panY}px) scale(${tools.zoom}) rotate(${tools.rotate}deg)`,
          transformOrigin: "center center"
        }}
        playsInline
        preload="auto"
        loop={loop}
        onContextMenu={(event) => event.preventDefault()}
        autoPlay={prefs.autoPlay && !mediaError}
        onClick={() => {
          if (ctx) {
            setCtx(null);
            return;
          }
          if (dragRef.current?.moved) return;
          togglePlay();
        }}
        onDoubleClick={toggleFs}
        onError={() => {
          setPlaying(false);
          setBuffering(false);
          setMediaError("This file cannot play. Upload an MP4 you own or license in admin.");
        }}
        onPlay={() => {
          setPlaying(true);
          void audioGraphRef.current?.resume();
          reportPlayback();
        }}
        onPause={() => {
          setPlaying(false);
          reportPlayback();
        }}
        onSeeked={() => {
          reportPlayback();
          releaseHold();
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => {
          setBuffering(false);
          releaseHold();
        }}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || durationSec || 0);
          const track = event.currentTarget.textTracks[0];
          if (track) track.mode = "hidden";
        }}
        onTimeUpdate={() => {
          const node = videoRef.current;
          if (!node) return;
          setCurrent(node.currentTime);
          setDuration(node.duration || durationSec || 0);
          if (node.buffered.length) setBuffered(node.buffered.end(node.buffered.length - 1));
          if (introEndSec && node.currentTime > introEndSec + 2) setShowSkip(false);
          if (
            prefs.autoSkipIntro &&
            introEndSec &&
            !skippedIntro.current &&
            node.currentTime >= Math.max(3, introFrom) &&
            node.currentTime < introEndSec
          ) {
            skippedIntro.current = true;
            node.currentTime = introEndSec;
            setShowSkip(false);
          }
          if ((prefs.autoNext || toolsRef.current.shuffle) && toolsRef.current.onEnded === "next" && (nextHref || playlist.length > 1) && nearOutro && countdown == null && node.duration - node.currentTime < 8) {
            setCountdown(5);
          }
          if (abRef.current.a != null && abRef.current.b != null && node.currentTime >= abRef.current.b) {
            node.currentTime = abRef.current.a;
          }
          void persist();
        }}
        onEnded={() => {
          void persist(true);
          if (loop || toolsRef.current.onEnded === "replay") {
            const node = videoRef.current;
            if (node) {
              node.currentTime = 0;
              void node.play().catch(() => undefined);
            }
            return;
          }
          if (toolsRef.current.onEnded === "next" && (prefs.autoNext || toolsRef.current.shuffle)) playNext();
        }}
      />
      <CaptionOverlay
        cues={localCues ?? cues}
        time={current}
        offset={tools.capOffset}
        visible={captions && hasCues}
        size={captionSize}
        color={tools.capColor}
        outline={tools.capOutline}
        box={tools.capBox}
        position={tools.capPos}
        under={tools.capUnder}
        fade={tools.capFade}
      />
      </div>

      {holdFrame ? (
        holdFrame === "black" ? (
          <div className="pointer-events-none absolute inset-0 z-[6] bg-black transition-opacity duration-200" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={holdFrame}
            alt=""
            className="pointer-events-none absolute inset-0 z-[6] h-full w-full object-contain bg-black transition-opacity duration-200"
          />
        )
      ) : null}

      {mediaError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 p-6 text-center">
          <div>
            <p className="text-sm text-white">{mediaError}</p>
            <p className="mt-2 text-xs text-white/60">Admin → Titles → upload a file for this episode.</p>
          </div>
        </div>
      ) : null}

      {buffering && !mediaError ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="size-10 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
        </div>
      ) : null}

      {!playing && !buffering && !mediaError && !holdFrame ? (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play"
        >
          <span className="rounded-full bg-accent p-4 text-accent-ink shadow-lg">
            <Play className="size-8 fill-current" />
          </span>
        </button>
      ) : null}

      {showSkip && introEndSec && inIntro && !prefs.autoSkipIntro ? (
        <button
          type="button"
          className="absolute right-4 bottom-24 z-10 rounded-full bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur-md hover:bg-white/25"
          onClick={() => {
            seek(introEndSec);
            setShowSkip(false);
          }}
        >
          Skip intro
        </button>
      ) : null}

      {countdown != null && (nextHref || playlist.length > 1) ? (
        <div className="absolute right-4 bottom-24 z-10 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-sm text-white">
          Next in {countdown}s
          <button type="button" className="text-accent" onClick={playNext}>
            Play
          </button>
          <button type="button" className="text-muted" onClick={() => setCountdown(null)}>
            Stay
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-linear-to-b from-black/70 to-transparent p-4 transition-opacity",
          chrome ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{title}</p>
          <p className="truncate text-xs text-white/70">{episodeName}</p>
        </div>
        {audioOptions.length > 1 ? (
          <button
            type="button"
            onClick={() => setMenu((v) => (v === "tracks" ? "none" : "tracks"))}
            className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15"
          >
            <Headphones className="size-3.5" />
            {audioTrackLabel(audioKind, audioLanguage)}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMenu((v) => (v === "tracks" ? "none" : "tracks"))}
            className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15"
          >
            {audioTrackLabel(audioKind, audioLanguage)}
          </button>
        )}
      </div>

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-3 pt-10 pb-3 transition-opacity",
          chrome ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <label
          className="relative block h-1.5 cursor-pointer rounded-full bg-white/20"
          onMouseMove={(event) => {
            if (!tools.seekTip || !duration) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            setHoverSeek({ time: ratio * duration, x: event.clientX - rect.left });
          }}
          onMouseLeave={() => setHoverSeek(null)}
        >
          <span className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${bufPct}%` }} />
          <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pct}%` }} />
          {tools.barMarkers && duration
            ? [introStartSec, introEndSec, outroStartSec].filter((mark): mark is number => typeof mark === "number" && mark > 0).map((mark) => (
                <span
                  key={mark}
                  className="absolute top-[-3px] h-3 w-0.5 bg-emerald-300"
                  style={{ left: `${(mark / duration) * 100}%` }}
                />
              ))
            : null}
          {hoverSeek && tools.seekTip ? (
            <span
              className="absolute -top-7 -translate-x-1/2 rounded bg-black/85 px-1.5 py-0.5 font-mono text-[10px] text-white"
              style={{ left: hoverSeek.x }}
            >
              {formatClock(hoverSeek.time)}
            </span>
          ) : null}
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={current}
            onChange={(event) => seek(Number(event.target.value))}
            className="absolute inset-0 w-full cursor-pointer opacity-0"
            aria-label="Seek"
          />
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-white">
          <IconButton label={playing ? "Pause" : "Play"} onClick={togglePlay}>
            {playing ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
          </IconButton>
          <IconButton label="Back 10s" onClick={() => seek(current - 10)}>
            <SkipBack className="size-4" />
          </IconButton>
          <IconButton label="Forward 10s" onClick={() => seek(current + 10)}>
            <SkipForward className="size-4" />
          </IconButton>
          {prevHref ? (
            <button type="button" className="px-1.5 text-xs text-white/80 hover:text-white" onClick={() => go(prevHref)}>
              Prev
            </button>
          ) : null}
          {nextHref ? (
            <button type="button" className="px-1.5 text-xs text-white/80 hover:text-white" onClick={() => go(nextHref)}>
              Next
            </button>
          ) : null}
          <span className="px-1 font-mono text-[11px] text-white/80">
            {formatClock(current)} / {formatClock(duration)}
          </span>
          <button type="button" className="ml-1" aria-label="Mute" onClick={() => setMuted((v) => !v)}>
            {muted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(event) => {
              setVolume(Number(event.target.value));
              setMuted(false);
            }}
            className="hidden w-16 accent-[var(--color-accent)] sm:block"
            aria-label="Volume"
          />
          <span className="ml-auto" />
          {hasCues ? (
            <IconButton label="Captions" onClick={() => setCaptions((v) => !v)}>
              <Captions className={cn("size-4", captions && "text-accent")} />
            </IconButton>
          ) : null}
          <IconButton label="Audio and subtitles" onClick={() => setMenu((v) => (v === "tracks" ? "none" : "tracks"))}>
            <Headphones className={cn("size-4", menu === "tracks" && "text-accent")} />
          </IconButton>
          <button
            type="button"
            className="rounded-md bg-white/10 px-1.5 py-1 text-[11px] text-white"
            aria-label="Speed"
            onClick={() => setMenu((v) => (v === "speed" ? "none" : "speed"))}
          >
            {speed}×
          </button>
          {qualities.length > 1 ? (
            <select
              value={quality}
              onChange={(event) => {
                const next = Number(event.target.value);
                setQuality(next);
                if (hlsRef.current) hlsRef.current.currentLevel = next;
              }}
              className="rounded-md bg-white/10 px-1.5 py-1 text-[11px] text-white"
              aria-label="Quality"
            >
              <option value={-1}>Auto</option>
              {qualities.map((item) => (
                <option key={item.index} value={item.index}>
                  {item.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="rounded-md bg-white/10 px-1.5 py-1 text-[11px]">HD</span>
          )}
          <IconButton
            label="Settings"
            onClick={() => setMenu((v) => (v === "settings" ? "none" : "settings"))}
          >
            <Settings className="size-4" />
          </IconButton>
          <span className="hidden sm:contents">
            <IconButton label="Picture in picture" onClick={togglePiP}>
              <PictureInPicture2 className="size-4" />
            </IconButton>
          </span>
          <button
            type="button"
            className="hidden px-1.5 text-[11px] text-white/80 hover:text-white md:inline"
            onClick={() => setTheater((v) => !v)}
          >
            {theater ? "Exit theater" : "Theater"}
          </button>
          <IconButton label={fs ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFs}>
            {fs ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </IconButton>
        </div>
      </div>

      {menu === "speed" ? (
        <div className="absolute right-24 bottom-16 z-20 w-28 rounded-2xl bg-black/90 p-1.5 text-white ring-1 ring-white/15">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
            <button
              key={rate}
              type="button"
              className={cn(
                "block w-full rounded-xl px-3 py-1.5 text-left text-xs",
                speed === rate ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"
              )}
              onClick={() => {
                setSpeed(rate);
                setMenu("none");
              }}
            >
              {rate}×
            </button>
          ))}
        </div>
      ) : null}

      {menu === "settings" ? (
        <div className="absolute right-3 bottom-16 z-20 w-64 rounded-2xl bg-black/85 p-3 text-sm text-white ring-1 ring-white/15">
          <p className="text-xs tracking-wide text-white/60 uppercase">Player</p>
          {[
            ["autoPlay", "Auto play"],
            ["autoNext", "Auto next"],
            ["autoSkipIntro", "Auto skip intro"]
          ].map(([key, label]) => (
            <label key={key} className="mt-2 flex items-center justify-between">
              {label}
              <input
                type="checkbox"
                checked={Boolean(prefs[key as keyof Preferences])}
                onChange={(event) => {
                  const next = { [key]: event.target.checked };
                  setPrefs((prev) => {
                    const merged = { ...prev, ...next };
                    writeLocalPrefs(merged);
                    return merged;
                  });
                  void api("/preferences", { method: "PUT", body: JSON.stringify(next) }).catch(() => undefined);
                }}
              />
            </label>
          ))}
          <button type="button" className="mt-3 text-xs text-accent" onClick={() => setMenu("keys")}>
            Keyboard shortcuts
          </button>
        </div>
      ) : null}

      {menu === "keys" ? (
        <div className="absolute inset-x-4 bottom-16 z-20 rounded-2xl bg-black/85 p-4 text-sm text-white ring-1 ring-white/15">
          <div className="flex justify-between">
            <p className="font-medium">Shortcuts</p>
            <button type="button" onClick={() => setMenu("none")} className="text-xs text-white/60">
              Close
            </button>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-white/80">
            <li>Space / K play</li>
            <li>J / L ±10s</li>
            <li>F fullscreen</li>
            <li>T theater</li>
            <li>M mute</li>
            <li>C captions</li>
            <li>N / P next prev</li>
            <li>0–9 jump</li>
            <li>Right-click more</li>
          </ul>
        </div>
      ) : null}

      {stats ? (
        <div className="pointer-events-none absolute top-14 left-4 z-20 rounded-lg bg-black/75 px-3 py-2 font-mono text-[11px] text-white/80 ring-1 ring-white/10">
          <p>{title}</p>
          <p>{episodeName}</p>
          <p>
            {formatClock(current)} / {formatClock(duration)} · {speed}× · {Math.round(volume * 100)}%
          </p>
          <p>
            {audioKind}
            {hasCues ? (captions ? " · captions on" : " · captions off") : ""}
            {loop ? " · loop" : ""}
            {tools.shuffle ? " · shuffle" : ""}
            {ab.a != null && ab.b != null ? ` · A–B ${formatClock(ab.a)}–${formatClock(ab.b)}` : ""}
          </p>
          <p>
            {Math.round(eq.brightness * 100)}/{Math.round(eq.contrast * 100)}/{Math.round(eq.saturate * 100)} hue {Math.round(eq.hue)} · zoom {tools.zoom.toFixed(1)}× · {tools.rotate}°
          </p>
        </div>
      ) : null}

      {ctx ? <PlayerContextMenu x={ctx.x} y={ctx.y} items={menuItems} onClose={closeCtx} /> : null}

      <input
        ref={subFileRef}
        type="file"
        accept=".vtt,.srt,.txt"
        className="hidden"
        onChange={(event) => {
          void loadSubtitleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {notice ? (
        <div className="pointer-events-none absolute top-16 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1 text-xs text-white ring-1 ring-white/15">
          {notice}
        </div>
      ) : null}

      {menu === "tracks" ? (
        <AudioTracksPanel
          audioKind={audioKind}
          audioLanguage={audioLanguage}
          audioOptions={audioOptions}
          captions={captions}
          captionLanguage={captionLang}
          captionOptions={captionOptions}
          onClose={() => setMenu("none")}
          onAudio={(href) => {
            setMenu("none");
            switchAudio(href);
          }}
          onCaptions={(on, language, url) => {
            setCaptions(on);
            if (language) {
              setCaptionLang(language);
              localStorage.setItem("anemi-caption-lang", language);
            }
            if (url) flash(language ? `${language} captions` : "Captions");
          }}
        />
      ) : null}

      {jumpOpen ? (
        <form
          className="absolute top-1/2 left-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 gap-2 rounded-xl bg-black/90 p-3 ring-1 ring-white/15"
          onSubmit={(event) => {
            event.preventDefault();
            const value = String(new FormData(event.currentTarget).get("jump") ?? "");
            const sec = parseClockInput(value);
            if (sec != null) seek(sec);
            setJumpOpen(false);
          }}
        >
          <input
            name="jump"
            autoFocus
            placeholder="1:23 or 83"
            className="h-9 w-36 rounded-lg bg-white/10 px-2 text-sm text-white"
          />
          <button type="submit" className="rounded-lg bg-accent px-3 text-sm text-accent-ink">
            Jump
          </button>
          <button type="button" className="text-xs text-white/60" onClick={() => setJumpOpen(false)}>
            Close
          </button>
        </form>
      ) : null}
    </div>
      {!followOnly ? (
        <WatchUnderbar
          episodeNumber={episodeNumber}
          episodeName={episodeName}
          audioKind={audioKind}
          audioLanguage={audioLanguage}
          audioOptions={audioOptions}
          captions={captions}
          captionLabel={captionLang}
          hasCues={hasCues}
          qualityLabel={qualityLabel}
          autoPlay={prefs.autoPlay}
          autoNext={prefs.autoNext}
          autoSkipIntro={prefs.autoSkipIntro}
          theater={theater}
          lightsOff={lightsOff}
          prevHref={prevHref}
          nextHref={nextHref}
          onNavigate={go}
          onTracks={() => setMenu((v) => (v === "tracks" ? "none" : "tracks"))}
          onTheater={() => setTheater((v) => !v)}
          onLights={() => setLightsOff((v) => !v)}
          onPref={patchPref}
          onCaptions={() => hasCues && setCaptions((v) => !v)}
        />
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="rounded-md p-1.5 hover:bg-white/10">
      {children}
    </button>
  );
}
