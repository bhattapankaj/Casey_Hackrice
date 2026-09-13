import { afterEach, describe, expect, it, vi } from "vitest";

function audioParam(initial = 0) {
  return {
    value: initial,
    cancelScheduledValues: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setValueAtTime: vi.fn(),
  };
}

class FakeGain {
  gain = audioParam(1);
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeOscillator {
  type = "sine";
  frequency = audioParam();
  onended: (() => void) | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];

  currentTime = 1;
  destination = {};
  gains: FakeGain[] = [];
  oscillators: FakeOscillator[] = [];
  sampleRate = 100;
  state = "running";
  resume = vi.fn();

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createBuffer() {
    return { getChannelData: () => new Float32Array(40) };
  }

  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }

  createOscillator() {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }
}

function installAudioWindow(soundSetting: string | null = null) {
  const setInterval = vi.fn(() => 37);
  const clearInterval = vi.fn();
  const localStorage = {
    getItem: vi.fn(() => soundSetting),
    setItem: vi.fn(),
  };
  vi.stubGlobal("window", {
    AudioContext: FakeAudioContext,
    clearInterval,
    localStorage,
    setInterval,
  });
  return { clearInterval, localStorage, setInterval };
}

afterEach(() => {
  FakeAudioContext.instances = [];
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("incoming call ring", () => {
  it("plays a double ring and stops every scheduled source during cleanup", async () => {
    const browser = installAudioWindow();
    const { startIncomingRing } = await import("@/lib/sound");

    const stop = startIncomingRing();
    const audio = FakeAudioContext.instances[0];

    expect(audio.oscillators).toHaveLength(4);
    expect(browser.setInterval).toHaveBeenCalledWith(expect.any(Function), 2_600);

    stop();

    expect(browser.clearInterval).toHaveBeenCalledWith(37);
    expect(audio.gains[1].gain.setValueAtTime).toHaveBeenLastCalledWith(0, 1);
    expect(audio.gains[1].disconnect).toHaveBeenCalledOnce();
    for (const oscillator of audio.oscillators) {
      expect(oscillator.stop).toHaveBeenCalledTimes(2);
    }
  });

  it("stays silent when the player has turned table sound off", async () => {
    const browser = installAudioWindow("off");
    const { startIncomingRing } = await import("@/lib/sound");

    startIncomingRing();

    expect(FakeAudioContext.instances).toHaveLength(0);
    expect(browser.setInterval).not.toHaveBeenCalled();
  });
});
