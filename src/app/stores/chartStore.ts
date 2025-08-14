import { create } from "zustand";
import type { InferPoint } from "@/interfaces/inferPoint";

interface ChartState {
    paused: boolean;
    data: InferPoint[];
    maxPoints: number;
    pointIdx: number;
    addData: (val: InferPoint) => void;
    reset: () => void;
}

export const useChartStore = create<ChartState>((set, get) => ({
    paused: true,
    data: [],
    maxPoints: 100,
    pointIdx: 0,
    addData: (val: InferPoint) => {
        const arr = [...get().data, { ...val, idx: get().pointIdx }].slice(
            -get().maxPoints
        );
        set({ data: arr });
        get().pointIdx++;
    },
    reset: () => set({ data: [], pointIdx: 0 }),
}));
