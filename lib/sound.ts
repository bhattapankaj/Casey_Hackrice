/**
 * Synthesized table sounds. No audio files, so nothing to download or license.
 * Every cue is a short filtered noise burst shaped like a real card or clay chip.
 */

export type Cue =
  | "deal"
  | "open"
  | "close"
  | "chip"
  | "pot"
  | "reveal"
  | "submit"
  | "investigate"
  | "hangup";

const STORAGE_KEY = "casey-sound";

let context: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = true;
let loaded = false;
let incomingRing: {
  intervalId: number | null;
  bus: GainNode;
  sources: Set<OscillatorNode>;
} | null = null;

type SoundListener = (on: boolean) => void;
const listeners = new Set<SoundListener>();

function load() {
  if (loaded || typeof window === "undefined") {
    return;
  }
  loaded = true;
  enabled = window.localStorage.getItem(STORAGE_KEY) !== "off";
}

export function soundEnabled(): boolean {
  load();
  return enabled;
}

export function subscribeToSound(listener: SoundListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setSoundEnabled(on: boolean) {
  load();
  enabled = on;
  window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  if (!on) {
    stopIncomingRing();
  }
  listeners.forEach((listener) => listener(on));
  if (on) {
    play("chip");
  }
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) {
      return null;
    }
    context = new Ctor();
    master = context.createGain();
    master.gain.value = 0.22;
    master.connect(context.destination);

    const frames = Math.floor(context.sampleRate * 0.4);
    noise = context.createBuffer(1, frames, context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  if (context.state === "suspended") {
    void context.resume();
  }

  return context;
}

/** Browsers block audio until a gesture, so the first click opens the context. */
export function unlockSound() {
  ensureContext();
}

type BurstOptions = {
  at: number;
  duration: number;
  frequency: number;
  q: number;
  gain: number;
  sweepTo?: number;
};

function burst(ctx: AudioContext, options: BurstOptions) {
  if (!noise || !master) {
    return;
  }

  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.playbackRate.value = 0.8 + Math.random() * 0.4;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(options.frequency, options.at);
  if (options.sweepTo) {
    filter.frequency.exponentialRampToValueAtTime(
      options.sweepTo,
      options.at + options.duration,
    );
  }
  filter.Q.value = options.q;

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, options.at);
  envelope.gain.exponentialRampToValueAtTime(options.gain, options.at + 0.004);
  envelope.gain.exponentialRampToValueAtTime(
    0.0001,
    options.at + options.duration,
  );

  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(master);
  source.start(options.at);
  source.stop(options.at + options.duration + 0.02);
}

type ToneOptions = {
  at: number;
  duration: number;
  frequency: number;
  gain: number;
  type?: OscillatorType;
  sweepTo?: number;
};

function tone(ctx: AudioContext, options: ToneOptions) {
  if (!master) {
    return;
  }

  const oscillator = ctx.createOscillator();
  oscillator.type = options.type ?? "sine";
  oscillator.frequency.setValueAtTime(options.frequency, options.at);
  if (options.sweepTo) {
    oscillator.frequency.exponentialRampToValueAtTime(
      options.sweepTo,
      options.at + options.duration,
    );
  }

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, options.at);
  envelope.gain.exponentialRampToValueAtTime(options.gain, options.at + 0.018);
  envelope.gain.exponentialRampToValueAtTime(
    0.0001,
    options.at + options.duration,
  );

  oscillator.connect(envelope);
  envelope.connect(master);
  oscillator.start(options.at);
  oscillator.stop(options.at + options.duration + 0.02);
}

function ringTone(
  ctx: AudioContext,
  ring: NonNullable<typeof incomingRing>,
  at: number,
  frequency: number,
  type: OscillatorType,
) {
  const oscillator = ctx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);

  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(0.18, at + 0.025);
  envelope.gain.setValueAtTime(0.16, at + 0.36);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.44);

  oscillator.connect(envelope);
  envelope.connect(ring.bus);
  ring.sources.add(oscillator);
  oscillator.onended = () => {
    ring.sources.delete(oscillator);
    oscillator.disconnect();
    envelope.disconnect();
  };
  oscillator.start(at);
  oscillator.stop(at + 0.46);
}

function scheduleIncomingRing(ctx: AudioContext, ring: NonNullable<typeof incomingRing>) {
  if (incomingRing !== ring) {
    return;
  }
  const start = ctx.currentTime + 0.02;
  for (const offset of [0, 0.64]) {
    ringTone(ctx, ring, start + offset, 520, "sine");
    ringTone(ctx, ring, start + offset, 660, "triangle");
  }
}

/** Start a medium-volume double ring until the returned cleanup function is called. */
export function startIncomingRing(): () => void {
  load();
  if (!enabled) {
    return () => undefined;
  }

  const ctx = ensureContext();
  if (!ctx || !master) {
    return () => undefined;
  }

  stopIncomingRing();
  const bus = ctx.createGain();
  bus.gain.value = 0.7;
  bus.connect(master);
  const ring: NonNullable<typeof incomingRing> = {
    intervalId: null,
    bus,
    sources: new Set<OscillatorNode>(),
  };
  incomingRing = ring;
  const begin = () => {
    if (incomingRing !== ring || ring.intervalId !== null) {
      return;
    }
    scheduleIncomingRing(ctx, ring);
    ring.intervalId = window.setInterval(() => scheduleIncomingRing(ctx, ring), 2_600);
  };
  if (ctx.state === "running") {
    begin();
  } else {
    void ctx.resume().then(begin).catch(() => undefined);
  }

  return () => {
    if (incomingRing === ring) {
      stopIncomingRing();
    }
  };
}

export function stopIncomingRing() {
  const ring = incomingRing;
  if (!ring) {
    return;
  }
  incomingRing = null;
  if (ring.intervalId !== null) {
    window.clearInterval(ring.intervalId);
  }
  const at = context?.currentTime ?? 0;
  ring.bus.gain.cancelScheduledValues(at);
  ring.bus.gain.setValueAtTime(0, at);
  for (const source of ring.sources) {
    try {
      source.stop(at);
    } catch {
      // The source may already have ended between the set snapshot and cleanup.
    }
  }
  ring.sources.clear();
  ring.bus.disconnect();
}

export function play(cue: Cue) {
  load();
  if (!enabled) {
    return;
  }

  const ctx = ensureContext();
  if (!ctx) {
    return;
  }

  const now = ctx.currentTime;

  switch (cue) {
    // A card skimming across felt, then landing.
    case "deal":
      burst(ctx, {
        at: now,
        duration: 0.09,
        frequency: 2600,
        sweepTo: 900,
        q: 0.9,
        gain: 0.35,
      });
      burst(ctx, {
        at: now + 0.07,
        duration: 0.035,
        frequency: 520,
        q: 2.4,
        gain: 0.3,
      });
      break;

    // The snap of a card turned face up.
    case "open":
      burst(ctx, { at: now, duration: 0.05, frequency: 4200, q: 1.6, gain: 0.5 });
      burst(ctx, {
        at: now + 0.012,
        duration: 0.06,
        frequency: 780,
        q: 2.2,
        gain: 0.32,
      });
      break;

    // The same card going back down on the table.
    case "close":
      burst(ctx, {
        at: now,
        duration: 0.07,
        frequency: 1500,
        sweepTo: 600,
        q: 1.1,
        gain: 0.3,
      });
      break;

    // Two clay chips knocking together.
    case "chip":
      burst(ctx, { at: now, duration: 0.05, frequency: 2300, q: 5.5, gain: 0.44 });
      burst(ctx, {
        at: now + 0.026,
        duration: 0.055,
        frequency: 1750,
        q: 6,
        gain: 0.34,
      });
      break;

    // A small stack pushed into the pot.
    case "pot":
      [0, 0.035, 0.062, 0.094].forEach((offset, index) => {
        burst(ctx, {
          at: now + offset,
          duration: 0.06,
          frequency: 2400 - index * 240,
          q: 6,
          gain: 0.4 - index * 0.06,
        });
      });
      break;

    // One card turning over in the showdown.
    case "reveal":
      burst(ctx, { at: now, duration: 0.045, frequency: 3200, q: 2, gain: 0.32 });
      break;

    // A short original reveal sting. Not a licensed game sample.
    case "submit":
      tone(ctx, {
        at: now,
        duration: 0.22,
        frequency: 62,
        type: "sine",
        gain: 0.42,
      });
      tone(ctx, {
        at: now + 0.04,
        duration: 0.48,
        frequency: 196,
        sweepTo: 523,
        type: "triangle",
        gain: 0.2,
      });
      burst(ctx, {
        at: now + 0.08,
        duration: 0.16,
        frequency: 1400,
        sweepTo: 420,
        q: 1.4,
        gain: 0.28,
      });
      tone(ctx, {
        at: now + 0.38,
        duration: 0.28,
        frequency: 311,
        sweepTo: 196,
        type: "sine",
        gain: 0.22,
      });
      break;

    // Soft two-note pass. The chip goes back. The case stays open.
    case "investigate":
      tone(ctx, {
        at: now,
        duration: 0.12,
        frequency: 392,
        type: "triangle",
        gain: 0.18,
      });
      tone(ctx, {
        at: now + 0.11,
        duration: 0.16,
        frequency: 311,
        type: "triangle",
        gain: 0.16,
      });
      burst(ctx, {
        at: now + 0.04,
        duration: 0.05,
        frequency: 2100,
        q: 4.2,
        gain: 0.22,
      });
      break;

    // The line dropping. Used when the 75-second limit ends the call.
    case "hangup":
      burst(ctx, {
        at: now,
        duration: 0.07,
        frequency: 1800,
        sweepTo: 500,
        q: 1.2,
        gain: 0.28,
      });
      tone(ctx, {
        at: now + 0.03,
        duration: 0.2,
        frequency: 440,
        sweepTo: 140,
        type: "sine",
        gain: 0.2,
      });
      break;
  }
}
