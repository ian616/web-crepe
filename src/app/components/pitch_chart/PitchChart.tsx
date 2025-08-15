import styles from "./PitchChart.module.scss";
import UplotReact from "uplot-react";
import "uplot/dist/uPlot.min.css";
import type uPlot from "uplot";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useChartStore } from "@/stores/chartStore";
import ChartTooltip from "../chart_tooltip/ChartTooltip";

export default function PitchChart() {
    const plotRef = useRef<uPlot | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);

    const xRef = useRef<number[]>([]);
    const yRef = useRef<(number | null)[]>([]);

    const [tip, setTip] = useState({ open: false, x: 0, y: 0, i: -1 });
    const setTipRef = useRef(setTip);
    setTipRef.current = setTip;

    const [overEl, setOverEl] = useState<HTMLDivElement | null>(null);

    const COLOR_SOLID = "#f6c35b"; // high confidence
    const COLOR_LOW = "rgba(229, 231, 235, 0.6)"; // low confidence
    const THRESHOLD = 0.35;

    const INITIAL_POINTS = 100;
    const Y_FALLBACK: [number, number] = [50, 500]; // 데이터 없을 때 Y 범위(Hz)

    const initData = useMemo(() => {
        const xs = Array.from({ length: INITIAL_POINTS }, (_, i) => i);
        const ys = Array<number | null>(INITIAL_POINTS).fill(null);
        return [xs, ys] as [number[], (number | null)[]];
    }, []);
    // chart graphics setting
    const options: uPlot.Options = useMemo(
        () => ({
            width: 600,
            height: 300,
            scales: {
                x: {
                    time: false,
                    // 데이터 없으면 0..INITIAL_POINTS-1로
                    range: (u, min, max) =>
                        Number.isFinite(min) && Number.isFinite(max)
                            ? [min, max]
                            : [0, INITIAL_POINTS - 1],
                },
                y: {
                    auto: true,
                    // 데이터 없으면 기본 Hz 범위로
                    range: (u, min, max) =>
                        Number.isFinite(min) && Number.isFinite(max)
                            ? [min, max]
                            : Y_FALLBACK,
                },
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
                {
                    width: 2.5,
                    spanGaps: true, // 한 줄로 이어서 그리고 색만 바꿔줌
                    stroke: (u: uPlot, si: number) => {
                        const ctx = u.ctx;
                        const { left, width } = u.bbox;

                        // 수평 그라디언트 (플롯 영역 기준)
                        const grad = ctx.createLinearGradient(
                            left,
                            0,
                            left + width,
                            0
                        );

                        const xs = u.data[0] as number[];
                        const pts = useChartStore.getState().data; // [{confidence, ...}]

                        if (!xs.length || !pts.length) return COLOR_SOLID;

                        // 현재 구간 색 계산 함수
                        const colorAt = (i: number) =>
                            (pts[i]?.confidence ?? 0) < THRESHOLD
                                ? COLOR_LOW
                                : COLOR_SOLID;

                        // x -> [0..1] 오프셋으로 정규화 (캔버스 좌표)
                        const offsetAt = (i: number) => {
                            const xpx = u.valToPos(xs[i]!, "x", true); // canvas px
                            return Math.min(
                                1,
                                Math.max(0, (xpx - left) / width)
                            );
                        };

                        // 세그먼트 색: i-1 ~ i 구간에서 하나라도 미달이면 회색
                        const segColor = (i: number) => {
                            const c0 = pts[i - 1]?.confidence ?? 0;
                            const c1 = pts[i]?.confidence ?? 0;
                            return c0 < THRESHOLD || c1 < THRESHOLD
                                ? COLOR_LOW
                                : COLOR_SOLID;
                        };

                        // 시작 세그먼트 색
                        let prev = segColor(1);
                        grad.addColorStop(0, prev);

                        // i 경계는 “세그먼트 경계” (i-1→i) 지점
                        for (let i = 2; i < xs.length; i++) {
                            const col = segColor(i);
                            if (col !== prev) {
                                const off = offsetAt(i - 1); // 경계 x (i-1 점 위치)
                                // 하드 스톱: 이전색 종료 & 새색 시작을 같은 위치에
                                grad.addColorStop(off, prev);
                                grad.addColorStop(Math.min(off + 1e-6, 1), col);
                                prev = col;
                            }
                        }

                        // 마지막 색 보장
                        grad.addColorStop(1, prev);

                        return grad; // <- strokeStyle 로 그라디언트 반환
                    },
                    points: {
                        show: (u, si, idx) => idx === u.cursor.idx,
                        stroke: "#fff",
                        fill: "#f6c35b",
                        size: 9,
                    },
                },
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
                        setOverEl(u.over as HTMLDivElement); // 포털 목적지
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
        const unsub = useChartStore.subscribe((s) => {
            const xs = s.data.map((p) => p.idx);
            const yRaw = s.data.map((p) => p.pitchHz);

            plotRef.current?.setData([xs, yRaw]);
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
