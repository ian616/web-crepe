import { TVMCore } from "../core/tvm_core.js";

export interface CrepeConfig {
    wasmUrl: string;
    cacheUrl: string;
    logger?: (msg: string) => void;
}

export class CrepeEngine {
    private core = new TVMCore();
    private fnName = "forward";
    private frames?: number;

    constructor(private cfg: CrepeConfig) {}

    async load() {
        await this.core.init({
            wasmUrl: this.cfg.wasmUrl,
            cacheUrl: this.cfg.cacheUrl,
            logger:
                this.cfg.logger ?? ((msg) => console.log("[CrepeEngine]", msg)),
        });
    }

    async infer(audio: Float32Array) {
        // hop_size=160
        this.frames = Math.floor(audio.length / 160);

        const x = this.core.empty([1, audio.length]);
        x.copyFrom(audio);

        // crepe forward 실행
        const result = this.core.run(this.fnName, [x]);
        if (!result || result.length === 0 || !result[0]) {
            throw new Error("Forward returned no output");
        }
        const y = result[0];
        // gpu NDArray → js Float32Array
        const bins = y.toArray() as Float32Array;
        y.dispose();
        x.dispose();

        // 후처리: soft-argmax → f0Hz, confidence 등
        const f0Hz = softArgmax(bins);
        return { bins, f0Hz };
    }

    dispose() {
        this.core.dispose();
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
