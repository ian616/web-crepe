import { CrepeEngine } from "./engine/crepe_engine.js";

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
        wasmUrl: "/model.wasm",
        cacheUrl: "/params.bin",
        logger: console.log,
    });

    try {
        // engine 초기화
        console.log("[INFO] Loading CREPE Engine...");
        await engine.load();
        console.log("[INFO] Engine loaded successfully.");

        // 오디오 파일 로드
        const wavResponse = await fetch(
            "/MusicDelta_BebopJazz_STEM_02.RESYN.wav"
        );
        if (!wavResponse.ok) {
            throw new Error(
                `Failed to load audio file: ${wavResponse.statusText}`
            );
        }

        const wavBuffer = await wavResponse.arrayBuffer();
        const floatData = new Float32Array(wavBuffer);

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

main().catch(console.error);
