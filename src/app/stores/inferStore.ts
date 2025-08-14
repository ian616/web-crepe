import { create } from "zustand";
import type { InferPoint } from "@/interfaces/inferPoint";

interface InferState {
    state: "idle" | "running" | "stopped";
    backend: "tvm" | "tfjs-webgpu" | "tfjs-webgl";
    model: "tiny" | "medium" | "full";
    isLoading: boolean;
}

export const useInferStore = create<InferState>((set, get) => ({
    state: "idle",
    backend: "tfjs-webgpu",
    model: "full",
    isLoading: false,
}));
