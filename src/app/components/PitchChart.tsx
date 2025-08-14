import styles from "./PitchChart.module.scss";
import UplotReact from "uplot-react";
import "uplot/dist/uPlot.min.css";
import type uPlot from "uplot";
import React, { useEffect, useRef } from "react";
import { useChartStore } from "@/stores/chartStore";

const options: uPlot.Options = {
    width: 600,
    height: 300,
    scales: {
        x: { time: false },
        y: { auto: true },
    },
    axes: [
        {
            stroke: "rgba(255,255,255,0.56)",
            grid: { show: true, stroke: "rgba(255,255,255,0.08)" },
        },
        { stroke: "rgba(255,255,255,0.56)", grid: { show: false } },
    ],
    series: [
        {}, // x 축
        { stroke: "#f6c35b", width: 2 }, // y 라인 스타일
    ],
};

const initialData: uPlot.AlignedData = [
    [0, 1, 2, 3, 4], // 시간값 (예시)
    [100, 200, 150, null, 300], // pitch 값
];

export default function PitchChart() {
    const plotRef = useRef<uPlot | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);

    const xRef = useRef<number[]>([]);
    const yRef = useRef<(number | null)[]>([]);
    // adjust chart size
    useEffect(() => {
        const el = containerRef.current;
        const u = plotRef.current;
        if (!el || !u) return;

        const handleResize = () => {
            const rect = el.getBoundingClientRect();
            u.setSize({
                width: Math.floor(rect.width),
                height: Math.floor(rect.height),
            });
        };

        handleResize();

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // chart data subscribe
    useEffect(() => {
        const unsub = useChartStore.subscribe(
            (y) => {
                yRef.current = y.data.map((point) => point.pitchHz);
                xRef.current = y.data.map((point)=>point.currentTime);
                plotRef.current?.setData([xRef.current, yRef.current]); // AlignedData
            }
        );
        // 초기 1회 세팅
        const y0 = useChartStore.getState().data;
        yRef.current = y0.map((point) => point.pitchHz);
        xRef.current = y0.map((point) => point.currentTime);
        plotRef.current?.setData([xRef.current, yRef.current]);
        return unsub;
    }, []);

    return (
        <div ref={containerRef} className={styles.container}>
            <UplotReact
                options={options}
                data={initialData}
                onCreate={(u) => {
                    plotRef.current = u;
                    if (containerRef.current) {
                        const rect =
                            containerRef.current.getBoundingClientRect();
                        u.setSize({
                            width: Math.floor(rect.width),
                            height: Math.floor(rect.height),
                        });
                    }
                    const y = useChartStore.getState().data.map((point) => point.pitchHz);
                    const x = useChartStore.getState().data.map((point) => point.currentTime);
                    u.setData([x, y]);
                }}
                onDelete={() => {
                    plotRef.current = undefined;
                }}
            />
        </div>
    );
}
