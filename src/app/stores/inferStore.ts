import { create } from "zustand";
import type { InferPoint } from "@/interfaces/inferPoint";
import { initEngine, startMIC, stopMIC, disposeEngine } from "../../lib/infer_mic";

type Backend = "tvm" | "tfjs-webgpu" | "tfjs-webgl" | undefined;
type Model = "tiny" | "medium" | "full" | undefined;
type RunState = "idle" | "ready" | "running";

interface InferState {
    state: RunState;
    backend: Backend;
    model: Model;
    isLoading: boolean;

    loadedBackend?: Backend;
    loadedModel?: Model;

    // actions
    init: () => Promise<void>;
    start: () => Promise<void>;
    stop: () => Promise<void>;

    setBackend: (b: Backend) => Promise<void>;
    setModel: (m: Model) => Promise<void>;
}

export const useInferStore = create<InferState>((set, get) => ({
    state: "idle",
    backend: undefined,
    model: undefined,
    isLoading: false,

    loadedBackend: undefined,
    loadedModel: undefined,

    // model & core 초기화
    init: async () => {
        const { backend, model, loadedBackend, loadedModel, isLoading, state } =
            get();

        if (!backend || !model) {
            console.warn(
                "[Infer] backend/model 미선택 상태로 init 시도 → 무시"
            );
            return;
        }
        if (isLoading) return;

        const needInit = loadedBackend !== backend || loadedModel !== model;
        if (!needInit && state !== "idle") {
            // 이미 같은 조합으로 초기화됨
            set({ state: "ready" });
            return;
        }

        // 실행 중이면 멈춤
        if (state === "running") {
            await get().stop();
        }

        set({ isLoading: true });
        try {
            if (needInit) {
                disposeEngine();
            }
            await initEngine(backend, model);
            set({
                loadedBackend: backend,
                loadedModel: model,
                state: "ready",
            });
        } catch (e) {
            console.error("[Infer] init error:", e);
            disposeEngine();
            set({
                state: "idle",
                loadedBackend: undefined,
                loadedModel: undefined,
            });
        } finally {
            set({ isLoading: false });
        }
    },

    // inference 시작 (init 선행 필요)
    start: async () => {
        const { isLoading, state, loadedBackend, loadedModel, backend, model } =
            get();
        if (isLoading) return;

        const isReady =
            state === "ready" &&
            loadedBackend === backend &&
            loadedModel === model;
        if (!isReady) {
            console.warn("[Infer] start() before init(). Call init() first.");
            return;
        }

        set({ isLoading: true });
        try {
            await startMIC();
            set({ state: "running" });
        } catch (e) {
            console.error("[Infer] start error:", e);
            // 엔진은 유지되므로 ready로 되돌림
            set({ state: "ready" });
        } finally {
            set({ isLoading: false });
        }
    },
    // inference 루프만 멈춤(엔진 유지)
    stop: async () => {
        try {
            await stopMIC();
        } catch (e) {
            console.error("[Infer] stop error:", e);
        } finally {
            set({ state: "ready" }); // 엔진 남아있음
        }
    },

    // 코어 셀렉터에서 호출
    setBackend: async (b) => {
        if (get().backend === b) return;
        set({ backend: b });
        if (get().state === "running") await get().stop();
        await get().init(); 
    },

    // 모델 셀렉터에서 호출
    setModel: async (m) => {
        if (get().model === m) return;
        set({ model: m });
        if (get().state === "running") await get().stop();
        await get().init(); 
    },
}));
