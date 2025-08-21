import * as tf from "@tensorflow/tfjs";

export interface TFJSCoreParams {
    modelUrl: string;
    modelType: string;
    logger?: (msg: string) => void;
}

export class TFJSCore {
    private model!: tf.GraphModel | tf.LayersModel;
    private modelType: string;
    private logger: (msg: string) => void;

    constructor(private params: TFJSCoreParams) {
        this.modelType = params.modelType;
        this.logger = params.logger ?? console.log;
    }

    async init(): Promise<void> {
        await tf.ready();
        
        // Set up the backend, preferring WebGPU if available.
        if (this.modelType==="tfjs-webgpu" && await tf.setBackend("webgpu")) {
            this.logger("[TFJSCore] Using WebGPU backend");
        } else if ( await tf.setBackend("webgl")) {
            this.logger("[TFJSCore] Using WebGL backend");
        } else {
            throw new Error("[TFJSCore] No suitable backend found. WebGL/WebGPU not supported.");
        }
        
        // Load the model from the specified URL.
        this.logger(`[TFJSCore] Loading model from ${this.params.modelUrl}...`);
        try {
            this.model = await tf.loadGraphModel(this.params.modelUrl);
            this.logger("[TFJSCore] Model loaded successfully.");
        } catch (error) {
            this.logger(`[TFJSCore] Failed to load model: ${error}`);
            throw error;
        }
    }

    async warmup(inputLen = 1024): Promise<void> {
        await tf.nextFrame();
        await tf.tidy(() => {
        const x = tf.zeros([1, inputLen]); // [B, T]
        const out = (this.model as any).predict
            ? (this.model as tf.LayersModel).predict(x)
            : (this.model as tf.GraphModel).execute({ input: x });
        if (Array.isArray(out)) out.forEach(t => (t as tf.Tensor).dataSync());
        else (out as tf.Tensor).dataSync();
        });
        this.logger("[TFJSCore] Warmup done.");
    }

    run(inputs: tf.Tensor[]): tf.Tensor[] {
        const outputs = tf.tidy(() => {
            const result = this.model.predict(inputs) as tf.Tensor | tf.Tensor[];
            return Array.isArray(result) ? result : [result];
        });

        return outputs;
    }

    empty(shape: number[], dtype: tf.DataType = "float32"): tf.Tensor {
        return tf.zeros(shape, dtype);
    }

    dispose() {
        if (this.model) {
            this.model.dispose();
            tf.disposeVariables();
            this.logger("[TFJSCore] Model disposed.");
        }
    }
}
