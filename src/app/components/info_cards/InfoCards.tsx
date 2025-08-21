import styles from "./InfoCards.module.scss";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FaPlay, FaPause } from "react-icons/fa";
import { useInferStore } from "@/stores/inferStore";
import CoreSelect from "./CoreSelect";
import ModelSelect from "./ModelSelect";
import { useEffect, useState } from "react";

type HeapStat = {
    supported: boolean;
    usedMB: number;
    limitMB: number;
    percent: number;
};

function InfoCards() {
    const isLoading = useInferStore((s) => s.isLoading);
    const runState = useInferStore((s) => s.state); // "idle" | "ready" | "running"
    const start = useInferStore((s) => s.start);
    const stop = useInferStore((s) => s.stop);

    const [heap, setHeap] = useState<HeapStat>({
        supported: false,
        usedMB: 0,
        limitMB: 0,
        percent: 0,
    });

    useEffect(() => {
        let mounted = true;

        const read = () => {
            const mem = (performance as any)?.memory;
            // used + limit 가 있어야 유효
            if (mem?.usedJSHeapSize && mem?.jsHeapSizeLimit) {
                const usedMB = mem.usedJSHeapSize / (1024 * 1024);
                const limitMB = mem.jsHeapSizeLimit / (1024 * 1024);
                const percent = Math.max(
                    0,
                    Math.min(100, (usedMB / limitMB) * 100)
                );
                if (mounted) {
                    setHeap({
                        supported: true,
                        usedMB,
                        limitMB,
                        percent,
                    });
                }
            } else if (mounted) {
                setHeap((h) => ({ ...h, supported: false }));
            }
        };

        read();
        const id = setInterval(read, 1000);
        return () => {
            mounted = false;
            clearInterval(id);
        };
    }, []);

    const fmt = (n: number) =>
        n >= 100 ? Math.round(n).toLocaleString() : n.toFixed(1);

    const handleClick = async () => {
        if (isLoading) return; // 로딩 중엔 무시
        if (runState === "running") {
            await stop(); // ⏸
        } else if (runState === "ready") {
            await start(); // ▶️
        } else {
            console.warn(
                "[InfoCards] Engine is idle. Select core/model to init first."
            );
        }
    };

    const isPlaying = runState === "running";
    const btnClass = isLoading
        ? styles.loading // 로딩이면 무조건 loading만
        : isPlaying
        ? styles.isPause
        : styles.isPlay;

    return (
        <div className={styles.container}>
            <div className={styles.leftHeader}>
                <div className={styles.playButton}>
                    <Button
                        size="default"
                        variant="default"
                        onClick={handleClick}
                        disabled={runState === "idle"}
                        className={btnClass}
                    >
                        {isLoading ? (
                            <span className={styles.dots} aria-hidden>
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                        ) : isPlaying ? (
                            <FaPause aria-label="Pause" />
                        ) : (
                            <FaPlay aria-label="Start" />
                        )}
                    </Button>
                </div>

                <CoreSelect />
                <ModelSelect />
            </div>
            <div className={styles.rightHeader}>
                <div
                    className={styles.infoItem}
                    title={
                        heap.supported
                            ? "JavaScript Heap"
                            : "Not supported in this browser"
                    }
                >
                    <span className={styles.icon}>📦</span>
                    {heap.supported ? (
                        <>
                            <span className={styles.value}>
                                {fmt(heap.usedMB)}
                            </span>
                            <span className={styles.unit}>
                                / {fmt(heap.limitMB)} MB
                            </span>
                        </>
                    ) : (
                        <span className={styles.value}>—</span>
                    )}
                </div>

                <Progress
                    className={styles.progress}
                    value={heap.supported ? Math.round(heap.percent) : 0}
                />
            </div>
        </div>
    );
}

export default InfoCards;
