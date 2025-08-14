import {create} from "zustand";
import type { InferPoint } from "@/interfaces/inferPoint";

interface ChartState {
  data: InferPoint[];
  maxPoints: number;
  addData: (val: InferPoint) => void;
  reset: () => void;
}

export const useChartStore = create<ChartState>((set, get) => ({
  data: [],
  maxPoints: 100,
  addData: (val: InferPoint) => {
    const arr = [...get().data, val].slice(-get().maxPoints);
    set({ data: arr });
  },
  reset: () => set({ data: [] }),
}));