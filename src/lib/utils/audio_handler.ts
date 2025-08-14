export async function loadWavMono16k(url: string, frameSize = 1024, hop = 160) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`WAV 로드 실패: ${resp.statusText}`);
  const buf = await resp.arrayBuffer();

  const AC = window.AudioContext || (window as any).webkitAudioContext;
  const ac = new AC();
  const decoded = await ac.decodeAudioData(buf); // 원 SR로 디코드
  const srcSr = decoded.sampleRate;

  // 이미 16k면 그대로 복사
  if (srcSr === 16000) {
    const pcm = decoded.getChannelData(0);
    return alignForFraming(new Float32Array(pcm), frameSize, hop);
  }

  // OfflineAudioContext로 16k 리샘플
  const duration = decoded.duration; // 초
  const tgtLen = Math.ceil(duration * 16000);
  const oac = new OfflineAudioContext(1, tgtLen, 16000);
  const src = oac.createBufferSource();
  src.buffer = decoded;
  src.connect(oac.destination);
  src.start(0);
  const rendered = await oac.startRendering();
  const pcm16k = new Float32Array(rendered.getChannelData(0));

  return alignForFraming(pcm16k, frameSize, hop);
}

function alignForFraming(x: Float32Array, frameSize: number, hop: number) {
  const nFrames = Math.floor((x.length - frameSize) / hop);
  const usable = frameSize + nFrames * hop;
  return x.slice(0, usable); 
}

export function sliceAudio(audio: Float32Array, frameSize = 1024, hopSize = 160) {
    const frames: Float32Array[] = [];
    const numFrames = Math.floor((audio.length - frameSize) / hopSize);
    for (let i = 0; i < numFrames; i++) {
        const start = i * hopSize;
        frames.push(audio.slice(start, start + frameSize));
    }
    return frames;
}