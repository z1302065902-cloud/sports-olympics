// ============================================================
// audio.js — 程序化音效 + 欢快背景音乐（WebAudio，无素材）
// BGM 随关卡主题色切换不同调性（明亮大调，运动进行曲风格）
// ============================================================
const SFX = (() => {
  let ctx = null, master = null, enabled = true;
  let bgmTimer = null, bgmIdx = 0, bgmKey = null;

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    enabled = true;
  }
  function tone(freq, dur, type = 'sine', vol = 0.2, delay = 0, slideTo = 0) {
    if (!ctx || !enabled) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  function noise(dur, vol = 0.2, delay = 0, filterFreq = 1000) {
    if (!ctx || !enabled) return;
    const t0 = ctx.currentTime + delay;
    const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  }

  return {
    unlock,
    play(name) {
      if (!ctx || !enabled) return;
      switch (name) {
        case 'click':  tone(660, 0.08, 'square', 0.1); break;
        case 'tap':    tone(520, 0.06, 'square', 0.12); break;
        case 'score':  tone(880, 0.1, 'triangle', 0.16); tone(1320, 0.12, 'triangle', 0.12, 0.06); break;
        case 'big':    [880, 1108, 1318, 1760].forEach((f, i) => tone(f, 0.12, 'triangle', 0.18, i * 0.06)); break;
        case 'miss':   tone(220, 0.2, 'sawtooth', 0.12, 0, 110); break;
        case 'go':     tone(660, 0.15, 'square', 0.18); tone(880, 0.2, 'square', 0.18, 0.12); break;
        case 'win':    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.12, 'triangle', 0.2, i * 0.07)); tone(1047, 0.35, 'sine', 0.2, 0.42); tone(1319, 0.4, 'sine', 0.16, 0.46); break;
        case 'lose':   [400, 350, 300, 250].forEach((f, i) => tone(f, 0.16, 'sawtooth', 0.12, i * 0.12)); break;
        case 'swish':  noise(0.15, 0.15, 0, 3000); break;
        case 'count':  tone(440, 0.08, 'square', 0.12); break;
      }
    },
    // 欢快 BGM：按关卡 key 生成（明亮大调进行曲节奏）
    startBgm(key = 0) {
      if (!ctx) return;
      const KEYS = [
        [261.63, 329.63, 392.0, 523.25],  // C
        [293.66, 369.99, 440.0, 587.33],  // D
        [329.63, 415.3, 493.88, 659.26],  // E
        [349.23, 440.0, 523.25, 698.46],  // F
        [392.0, 493.88, 587.33, 783.99],  // G
        [440.0, 554.37, 659.26, 880.0],   // A
      ];
      bgmKey = key;
      this.stopBgm();
      const chord = KEYS[key % KEYS.length];
      let step = 0;
      bgmTimer = setInterval(() => {
        if (!ctx || ctx.state !== 'running') return;
        // 进行曲节奏：低音根音 + 明亮三和弦琶音
        const root = chord[0] / 2;
        tone(root, 0.22, 'triangle', 0.10);
        tone(chord[step % 4], 0.14, 'square', 0.045);
        tone(chord[(step + 1) % 4] * 1.5, 0.16, 'triangle', 0.06);
        if (step % 4 === 0) tone(chord[0] * 2, 0.2, 'sine', 0.06);
        step++;
      }, 250); // 240BPM 轻快
    },
    stopBgm() { if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } },
    bgmKey() { return bgmKey; },
  };
})();
