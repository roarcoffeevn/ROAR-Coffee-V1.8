// Lightweight Web Audio API synthesizer for ROAR Play & Win mini-games
class RoarGameSoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  tick() {
    this.playTone(720, 0.04, 'triangle', 0.045);
  }

  flip() {
    this.playTone(520, 0.07, 'sine', 0.05);
  }

  match() {
    this.playTone(587.33, 0.09, 'sine', 0.07, 0);
    this.playTone(880, 0.14, 'sine', 0.07, 0.07);
  }

  catchGood() {
    this.playTone(660, 0.07, 'triangle', 0.06, 0);
    this.playTone(990, 0.11, 'triangle', 0.06, 0.05);
  }

  catchGolden() {
    this.playTone(784, 0.08, 'sine', 0.08, 0);
    this.playTone(1046.5, 0.09, 'sine', 0.08, 0.06);
    this.playTone(1318.5, 0.16, 'sine', 0.08, 0.12);
  }

  catchBad() {
    this.playTone(190, 0.16, 'sawtooth', 0.055, 0);
    this.playTone(135, 0.2, 'sawtooth', 0.055, 0.08);
  }

  rattle() {
    this.playTone(320, 0.035, 'triangle', 0.04, 0);
    this.playTone(460, 0.035, 'triangle', 0.035, 0.04);
  }

  fortuneReveal() {
    this.playTone(587.33, 0.14, 'sine', 0.07, 0);
    this.playTone(783.99, 0.18, 'sine', 0.07, 0.1);
    this.playTone(1174.66, 0.28, 'triangle', 0.08, 0.2);
  }

  placeBlock() {
    this.playTone(440, 0.055, 'triangle', 0.05, 0);
    this.playTone(620, 0.045, 'sine', 0.04, 0.025);
  }

  clearLine(combo = 1) {
    const base = 523.25 + Math.min(combo - 1, 6) * 55;
    this.playTone(base, 0.09, 'triangle', 0.075, 0);
    this.playTone(base * 1.25, 0.11, 'sine', 0.075, 0.05);
    this.playTone(base * 1.5, 0.18, 'triangle', 0.08, 0.1);
  }

  gameOver() {
    this.playTone(330, 0.16, 'triangle', 0.06, 0);
    this.playTone(261.63, 0.22, 'triangle', 0.06, 0.12);
  }

  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, 'triangle', 0.08, idx * 0.09);
    });
  }
}

export const gameSound = new RoarGameSoundEngine();
