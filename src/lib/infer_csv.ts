import { CrepeEngine } from "./engine/crepe_engine.js";
import "@tensorflow/tfjs-backend-webgpu"; 
import {loadWavMono16k, sliceAudio} from "./utils/audio_handler.js";


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

export async function inferCSV() {
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

        for (const frame of frames) {
            const { bins, f0Hz } = await engine.infer(frame);

            const confidence = Math.max(...bins);

            f0HzAll.push(f0Hz);
            confAll.push(confidence);
        }

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
