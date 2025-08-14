import styles from "./PitchChart.module.scss";
import UplotReact from "uplot-react";
import "uplot/dist/uPlot.min.css";
import type uPlot from "uplot";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useChartStore } from "@/stores/chartStore";
import ChartTooltip from "./ChartTooltip";

export default function PitchChart() {
    const plotRef = useRef<uPlot | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);

    const xRef = useRef<number[]>([]);
    const yRef = useRef<(number | null)[]>([]);

    const [tip, setTip] = useState({ open: false, x: 0, y: 0, i: -1 });
    const setTipRef = useRef(setTip);
    setTipRef.current = setTip;

    const [overEl, setOverEl] = useState<HTMLDivElement | null>(null);

    // chart graphics setting
    const options: uPlot.Options = useMemo(
        () => ({
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
                { stroke: "#f6c35b", width: 1 }, // y 라인 스타일
            ],
            legend: {
                show: false,
            },
            cursor: {
                // zoom 기능 비활성화
                drag: {
                    x: false,
                    y: false,
                    setScale: false,
                },
            },
            hooks: {
                setCursor: [
                    (u) => {
                        const { idx, left, top } = u.cursor;
                        if (idx == null || idx < 0) {
                            setTip((t) => (t.open ? { ...t, open: false } : t));
                            return;
                        }

                        const xVal = (u.data[0] as number[])[idx];
                        const yVal = (u.data[1] as (number | null)[])[idx];
                        if (xVal == null || yVal == null) {
                            setTipRef.current((t) =>
                                t.open ? { ...t, open: false } : t
                            );
                            return;
                        }
                        const px = u.valToPos(xVal, "x", false);
                        const py = u.valToPos(yVal, "y", false);

                        setTipRef.current({
                            open: true,
                            x: px,
                            y: py,
                            i: idx,
                        });
                    },
                ],
                ready: [
                    (u) => {
                        setOverEl(u.over as HTMLDivElement); // ★ 포털 목적지
                    },
                ],
            },
        }),
        []
    );
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
        const unsub = useChartStore.subscribe((y) => {
            yRef.current = y.data.map((point) => point.pitchHz);
            xRef.current = y.data.map((point) => point.idx);
            plotRef.current?.setData([xRef.current, yRef.current]); // AlignedData
        });

        return unsub;
    }, []);

    return (
        <div ref={containerRef} className={styles.container}>
            <UplotReact
                options={options}
                data={[[], []]}
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
                }}
                onDelete={() => {
                    plotRef.current = undefined;
                }}
            />
            <ChartTooltip
                open={tip.open}
                x={tip.x}
                y={tip.y}
                i={tip.i}
                portalContainer={overEl}
            />
        </div>
    );
}
