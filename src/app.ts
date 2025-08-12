import { CrepeEngine } from "./engine/crepe_engine.js";
import "@tensorflow/tfjs-backend-webgpu"; 

async function loadWavMono16k(url: string, frameSize = 1024, hop = 160) {
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

// 프레임 자르기와 동일한 개수 나오도록 tail 정렬
function alignForFraming(x: Float32Array, frameSize: number, hop: number) {
  const nFrames = Math.floor((x.length - frameSize) / hop);
  const usable = frameSize + nFrames * hop;
  return x.slice(0, usable); // 파이썬 (N - frame)//hop 과 동일한 길이 보장
}

function sliceAudio(audio: Float32Array, frameSize = 1024, hopSize = 160) {
    const frames: Float32Array[] = [];
    const numFrames = Math.floor((audio.length - frameSize) / hopSize);
    for (let i = 0; i < numFrames; i++) {
        const start = i * hopSize;
        frames.push(audio.slice(start, start + frameSize));
    }
    return frames;
}

async function saveCSV(
    times: number[],
    freqs: number[],
    confs: number[],
    filename = "output.csv"
) {
    const header = "time,frequency,confidence\n";
    const rows = times.map((t, i) => `${t},${freqs[i]},${confs[i]}`).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export async function main() {
    const engine = new CrepeEngine({
        coreType: "tfjs",
        tfjsUrl: "tfjs/model.json",
        // wasmUrl: "tvm/model.wasm",
        // cacheUrl: "tvm/params.bin",
        logger: console.log,
    });

    try {
        // engine 초기화
        console.log("[INFO] Loading CREPE Engine...");
        await engine.load();
        console.log("[INFO] Engine loaded successfully.");

        const floatData = await loadWavMono16k("/MusicDelta_BebopJazz_STEM_02.RESYN.wav");

        const frameSize = 1024;
        const hopSize = 160;
        const frames = sliceAudio(floatData, frameSize, hopSize); 

        console.log(`[INFO] Total frames: ${frames.length}`);

        const f0HzAll: number[] = [];
        const confAll: number[] = [];

        // 모든 frame 순차 추론
        for (const frame of frames) {
            const { bins, f0Hz } = await engine.infer(frame);

            const confidence = Math.max(...bins);

            f0HzAll.push(f0Hz);
            confAll.push(confidence);
        }

        // 시간축 계산
        const times = f0HzAll.map(
            (_, i) => (i * hopSize) / 16000 // sampleRate=16000
        );

        // CSV 저장
        await saveCSV(times, f0HzAll, confAll, "crepe_output.csv");

        console.log("[RESULT] CSV saved: crepe_output.csv");
    } catch (err) {
        console.error("[ERROR] Inference failed:", err);
    } finally {
        engine.dispose();
        console.log("[INFO] Engine disposed.");
    }
}
