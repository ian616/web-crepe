import { CrepeEngine } from "./engine/crepe_engine.js";
import "@tensorflow/tfjs-backend-webgpu";
import { useChartStore } from "@/stores/chartStore";
import type { InferPoint } from "@/interfaces/inferPoint";
import { fromFreq } from "@tonaljs/note";
import { use } from "react";

let mediaStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let workletNode: AudioWorkletNode | null = null;
let engine: CrepeEngine | null = null;
let running = false;

export async function inferMIC() {
    engine = new CrepeEngine({
        coreType: "tfjs",
        tfjsUrl: "tfjs/saved_model/model.json",
        // wasmUrl: "tvm/model.wasm",
        // cacheUrl: "tvm/params.bin",
        logger: console.log,
    });

    console.log("[INFO] Loading CREPE Engine...");
    await engine.load();
    console.log("[INFO] Engine loaded successfully.");

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioContext = new AudioContext(); // 입력 SR은 default (48k)
    // libsamplerate-js의 worklet 빌드
    await audioContext.audioWorklet.addModule(
        "https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js/dist/libsamplerate.worklet.js"
    );
    // custom 마이크 처리 worklet
    await audioContext.audioWorklet.addModule("/mic.worklet.js");

    workletNode = new AudioWorkletNode(audioContext, "mic-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        processorOptions: { targetRate: 16000, frameSize: 1024, hopSize: 160 },
    });

    audioContext.createMediaStreamSource(mediaStream).connect(workletNode);

    let busy = false;
    let lastLog = 0;
    const LOG_EVERY_MS = 20;

    workletNode.port.onmessage = async (e) => {
        if (e.data?.type !== "frame") return;

        // 추론 중이면 이번 프레임은 드롭 (지연 누적 방지)
        if (busy) return;
        busy = true;

        const frame: Float32Array = e.data.frame;
        const startInfer = performance.now();

        try {
            const { bins, f0Hz } = await engine!.infer(frame);
            const endInfer = performance.now();
            const latency = endInfer - startInfer;

            const now = performance.now();
            if (now - lastLog > LOG_EVERY_MS) {
                const conf = Math.max(...bins);
                // console.log(
                //     `Pitch ${f0Hz.toFixed(2)} Hz | Conf ${conf.toFixed(
                //         3
                //     )} | Latency ${latency.toFixed(1)} ms`
                // );
                useChartStore.getState().addData(createInferPoint(f0Hz, conf, latency, now));
                lastLog = now;
            }
        } catch (err) {
            console.error("infer error:", err);
        } finally {
            busy = false;
        }
    };
}

function createInferPoint(f0Hz: number, conf: number, latency: number, currentTime: number): InferPoint {
    const hzToCents = (f: number) => 1200 * Math.log2(f / 10.0);
    return {
        idx: useChartStore.getState().pointIdx,
        pitchHz: f0Hz,
        pitchCents: hzToCents(f0Hz),
        pitchNotes: fromFreq(f0Hz).toString(),
        confidence: conf,
        currentTime: currentTime,
        latency: latency,
    };
}

export async function stopMIC() {
    // 메시지 핸들러 해제
    if (workletNode) {
        workletNode.port.onmessage = null!;
    }

    // 오디오 그래프 끊기
    try {
        if (workletNode) {
            workletNode.disconnect();
            workletNode = null;
        }
    } catch {}

    // 마이크 중지
    if (mediaStream) {
        for (const track of mediaStream.getTracks()) track.stop();
        mediaStream = null;
    }

    // 오디오컨텍스트 정리
    if (audioContext) {
        try {
            await audioContext.close();
        } catch {}
        audioContext = null;
    }

    running = false;
    console.log("[INFO] MIC inference stopped.");
}
