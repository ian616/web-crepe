import * as tvmjs from "../../../tvm-unity/web/lib/index.js";

export interface TVMCoreParams {
    wasmUrl: string;
    cacheUrl: string;
    logger?: (msg: string) => void;
}

export class TVMCore {
    public inst!: tvmjs.Instance;
    public device!: tvmjs.DLDevice;
    public vm!: tvmjs.VirtualMachine;

    async init(params: TVMCoreParams): Promise<void> {
        // tvmjs 인스턴스 초기화
        const wasi = tvmjs.createPolyfillWASI();

        const buf = await fetch(params.wasmUrl).then((r) => r.arrayBuffer());
        this.inst = await tvmjs.instantiate(
            buf,
            wasi,
            params.logger ?? console.log
        );

        // WebGPU 디바이스 초기화
        const detect = await tvmjs.detectGPUDevice();
        if (!detect) throw new Error("[TVMCore] WebGPU not available");
        this.inst.initWebGPU(detect.device);
        this.device = this.inst.webgpu();

        await this.inst.fetchNDArrayCache(params.cacheUrl, this.inst.webgpu());
        this.vm = this.inst.createVirtualMachine(this.device);
    }

    run(fnName: string, inputs: tvmjs.NDArray[]): tvmjs.NDArray[] {
        const fn = this.vm.getFunction(fnName);
        return fn(...inputs) as tvmjs.NDArray[];
    }

    // DLDataType 에서 2, 32, 1은 float32를 의미
    empty(
        shape: number[],
        dtype: tvmjs.DLDataType = new tvmjs.DLDataType(2, 32, 1)
    ): tvmjs.NDArray {
        return this.inst.empty(shape, dtype, this.device);
    }

    dispose() {
        this.inst.dispose();
    }
}
