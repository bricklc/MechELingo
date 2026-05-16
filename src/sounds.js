const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
let audioContext;

const getAudioContext = () => {
  if (!AudioContextClass) return undefined;
  audioContext ||= new AudioContextClass();
  return audioContext;
};

const playTone = (frequency, startTime, duration, gain = 0.08) => {
  const context = getAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.exponentialRampToValueAtTime(gain, startTime + 0.015);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(envelope);
  envelope.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
};

export const playCorrectSound = () => {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  playTone(659.25, now, 0.12, 0.07);
  playTone(880, now + 0.08, 0.16, 0.08);
  playTone(1174.66, now + 0.18, 0.22, 0.06);
};

export const playWrongSound = () => {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  playTone(392, now, 0.12, 0.08);
  playTone(293.66, now + 0.12, 0.14, 0.08);
  playTone(196, now + 0.26, 0.22, 0.09);
};
