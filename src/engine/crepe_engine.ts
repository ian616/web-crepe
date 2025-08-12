import { TFJSCore } from "../core/tfjs_core.js";
import { TVMCore } from "../core/tvm_core.js";
import * as tf from "@tensorflow/tfjs";

/**
 * in case of using TVM core: wasmUrl, cacheUrl is needed.
 * in case of using TFJS core: modelUrl is needed.
 */
export interface CrepeConfig {
    coreType: "tvm" | "tfjs";
    tfjsUrl?: string; 
    wasmUrl?: string;
    cacheUrl?: string;
    logger?: (msg: string) => void;
}

export class CrepeEngine {
    private core: TVMCore | TFJSCore;
    private fnName = "forward";
    private frames?: number;
    private readonly hopSize = 160;

    constructor(private cfg: CrepeConfig) {
        if (this.cfg.coreType === "tvm") {
            this.core = new TVMCore();
        } else if (this.cfg.coreType === "tfjs") {
            this.core = new TFJSCore({ modelUrl: this.cfg.tfjsUrl! });
        } else {
            throw new Error("Invalid coreType specified in CrepeConfig.");
        }
    }

    async load() {
        if (this.cfg.coreType === "tvm") {
            await (this.core as TVMCore).init({
                wasmUrl: this.cfg.wasmUrl!,
                cacheUrl: this.cfg.cacheUrl!,
                logger: this.cfg.logger ?? ((msg) => console.log("[CrepeEngine]", msg)),
            });
        } else if (this.cfg.coreType === "tfjs") {
            await (this.core as TFJSCore).init();
        }
    }

    async infer(audio: Float32Array) {
        this.frames = Math.floor(audio.length / this.hopSize);

        let bins: Float32Array;
        let disposed = false; // Flag to ensure tensors are disposed only once

        try {
            if (this.cfg.coreType === "tvm") {
                bins = await this.inferWithTVM(audio);
            } else if (this.cfg.coreType === "tfjs") {
                bins = await this.inferWithTFJS(audio);
            } else {
                throw new Error("Invalid coreType for inference.");
            }
            disposed = true; // Mark as disposed if no error occurred
            
            const f0Hz = softArgmax(bins);
            return { bins, f0Hz };
        } finally {
            if (!disposed) {
                this.dispose();
            }
        }
    }

    dispose() {
        this.core.dispose();
    }

    private async inferWithTVM(audio: Float32Array): Promise<Float32Array> {
        const tvmCore = this.core as TVMCore;
        const x = tvmCore.empty([1, audio.length]);
        x.copyFrom(audio);

        const result = tvmCore.run(this.fnName, [x]);
        if (!result || result.length === 0 || !result[0]) {
            x.dispose();
            throw new Error("TVM forward returned no output");
        }
        const y = result[0];
        const bins = y.toArray() as Float32Array;

        y.dispose();
        x.dispose();
        return bins;
    }

    private async inferWithTFJS(audio: Float32Array): Promise<Float32Array> {
        const tfjsCore = this.core as TFJSCore;
        const audioTensor = tf.tensor(audio, [1, audio.length], "float32");

        const result = tfjsCore.run([audioTensor]);
        if (!result || result.length === 0 || !result[0]) {
            audioTensor.dispose();
            throw new Error("TFJS inference returned no output");
        }
        const binsTensor = result[0];
        const bins = binsTensor.dataSync() as Float32Array;

        audioTensor.dispose();
        binsTensor.dispose();
        return bins;
    }
}



function softArgmax(activations: Float32Array): number {
    const bins = 360;
    const hzToCents = (f: number) => 1200 * Math.log2(f / 10.0);
    const weightedCentToHz = (c: number) => 10.0 * Math.pow(2, c / 1200);
    const cMin = hzToCents(32.7);
    const cMax = hzToCents(1975.5);
    const centBins: number[] = Array.from(
        { length: bins },
        (_, i) => cMin + (cMax - cMin) * (i / (bins - 1))
    );

    const sumBins = activations.reduce((a, b) => a + b, 0);
    let weightedC = 0;
    for (let i = 0; i < bins; i++) {
        weightedC += activations[i]! * centBins[i]!;
    }
    weightedC /= sumBins;

    return weightedCentToHz(weightedC);
}
