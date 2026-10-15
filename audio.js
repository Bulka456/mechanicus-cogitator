let audioCtx = null;
let masterGain = null;
let isTransitActive = false;
let transitTimer = null;
let noiseBuffer = null;
let tunnelRumbleOsc = null;
let tunnelRumbleGain = null;

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
    createNoiseBuffer();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function createNoiseBuffer() {
  const bufferSize = audioCtx.sampleRate * 2;
  noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
}

function triggerRelayImpact() {
  try {
    initAudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, audioCtx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch(e) {}
}

function playGeigerBurst(clicksCount = 5) {
  try {
    initAudioContext();
    for (let i = 0; i < clicksCount; i++) {
      const delay = Math.random() * 0.15;
      const clickTime = audioCtx.currentTime + delay;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1800 + Math.random() * 800, clickTime);
      gain.gain.setValueAtTime(0.3, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.015);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(clickTime);
      osc.stop(clickTime + 0.015);
    }
  } catch(e) {}
}

function playLiturgicalChime() {
  try {
    initAudioContext();
    const now = audioCtx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.15 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  } catch(e) {}
}

function playSuccessChime() {
  try {
    initAudioContext();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.08);
    osc.frequency.setValueAtTime(783.99, now + 0.16);
    osc.frequency.setValueAtTime(1046.50, now + 0.24);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch(e) {}
}

function playFaultBuzzer() {
  try {
    initAudioContext();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(75, now + 0.25);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.28);
    playGeigerBurst(4);
  } catch(e) {}
}

function startTunnelRumble() {
  tunnelRumbleOsc = audioCtx.createOscillator();
  tunnelRumbleOsc.type = 'sawtooth';
  tunnelRumbleOsc.frequency.setValueAtTime(54, audioCtx.currentTime);
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(140, audioCtx.currentTime);
  tunnelRumbleGain = audioCtx.createGain();
  tunnelRumbleGain.gain.setValueAtTime(0.35, audioCtx.currentTime);
  tunnelRumbleOsc.connect(filter);
  filter.connect(tunnelRumbleGain);
  tunnelRumbleGain.connect(masterGain);
  tunnelRumbleOsc.start();
}

function stopTunnelRumble() {
  if (tunnelRumbleOsc) {
    try {
      tunnelRumbleGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      tunnelRumbleOsc.stop(audioCtx.currentTime + 0.35);
    } catch(e){}
    tunnelRumbleOsc = null;
  }
}

function playRailJointHit(time, strength = 1.0) {
  if (!isTransitActive) return;
  const thudOsc = audioCtx.createOscillator();
  const thudGain = audioCtx.createGain();
  thudOsc.type = 'sine';
  thudOsc.frequency.setValueAtTime(90, time);
  thudOsc.frequency.exponentialRampToValueAtTime(36, time + 0.08);
  thudGain.gain.setValueAtTime(0.6 * strength, time);
  thudGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
  thudOsc.connect(thudGain);
  thudGain.connect(masterGain);
  thudOsc.start(time);
  thudOsc.stop(time + 0.09);
}

let transitStep = 0;
function transitEngineTick() {
  if (!isTransitActive) return;
  const now = audioCtx.currentTime;
  const s = transitStep % 8;
  if (s === 0) playRailJointHit(now, 1.0);
  else if (s === 1) playRailJointHit(now + 0.03, 0.7);
  else if (s === 3) playRailJointHit(now, 0.85);
  else if (s === 4) playRailJointHit(now + 0.03, 0.65);
  transitStep++;
}

function toggleTransitLineAudio() {
  initAudioContext();
  const btn = document.getElementById('audio-toggle-btn');
  const led = document.getElementById('audio-led');
  const ext = document.getElementById('external-audio');

  if (ext.src && ext.src !== window.location.href) {
    if (ext.paused) {
      ext.play();
      btn.innerText = "⏸ ОСТАНОВИТЬ ВОКС (MP3)";
      led.innerText = "● ВОСПРОИЗВЕДЕНИЕ MP3";
      led.style.color = "var(--crt-green)";
    } else {
      ext.pause();
      btn.innerText = "▶ ВОЗОБНОВИТЬ ВОКС (MP3)";
      led.innerText = "● ПАУЗА";
      led.style.color = "var(--warning-amber)";
    }
    return;
  }

  isTransitActive = !isTransitActive;
  if (isTransitActive) {
    btn.innerText = "⏸ ОСТАНОВИТЬ МАГИСТРАЛЬ";
    led.innerText = "● ДВИЖЕНИЕ В СЛУЖЕНИИ";
    led.style.color = "var(--crt-green)";
    startTunnelRumble();
    transitEngineTick();
    transitTimer = setInterval(transitEngineTick, 140);
  } else {
    btn.innerText = "▶ ЗАПУСТИТЬ РЕЛЬСОВУЮ МАГИСТРАЛЬ";
    led.innerText = "● ОЖИДАНИЕ";
    led.style.color = "var(--warning-amber)";
    clearInterval(transitTimer);
    stopTunnelRumble();
  }
}

function setLineVolume(vol) {
  initAudioContext();
  if (masterGain) masterGain.gain.setValueAtTime(parseFloat(vol), audioCtx.currentTime);
  const ext = document.getElementById('external-audio');
  if (ext) ext.volume = parseFloat(vol);
}

function loadExternalHymn(e) {
  const file = e.target.files[0];
  if (file) {
    if (isTransitActive) toggleTransitLineAudio();
    const url = URL.createObjectURL(file);
    const player = document.getElementById('external-audio');
    player.src = url;
    player.play();
    document.getElementById('audio-toggle-btn').innerText = "⏸ ОСТАНОВИТЬ ВОКС (MP3)";
    const led = document.getElementById('audio-led');
    led.innerText = "● ФАЙЛ: " + file.name.substring(0, 16);
    led.style.color = "var(--crt-green)";
  }
}
