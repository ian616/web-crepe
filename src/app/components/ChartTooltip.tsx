import { useChartStore } from "@/stores/chartStore";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./ChartTooltip.module.scss";

type ChartTooltipProps = {
    open: boolean;
    x: number;
    y: number;
    i: number;
    portalContainer?: HTMLElement | null;
};

export default function ChartTooltip({
    open,
    x,
    y,
    i,
    portalContainer,
}: ChartTooltipProps) {
    if (!open || !portalContainer) {
        return null;
    }
    const TOOLTIP_WIDTH = 180;

    let left = x + 10;
    let top = y - 50;

    if (portalContainer) {
        const rect = portalContainer.getBoundingClientRect();
        const maxLeft = rect.width - TOOLTIP_WIDTH + 20;
        if (left > maxLeft) {
            left = left - TOOLTIP_WIDTH - 20; // 왼쪽으로 이동
        }
    }
    const {
        pitchHz = 0,
        pitchCents = 0,
        pitchNotes = "—",
        confidence = 0,
        currentTime = 0,
        latency = 0,
    } = useChartStore.getState().data[i] ?? {};

    return createPortal(
        <div
            className={`${styles.tooltip} ${open ? styles.open : ""}`}
            style={{ left, top }}
        >
            <div className={styles.header}>{pitchNotes}</div>
            <div className={styles.sub}>
                {pitchHz.toFixed(1)} <span className={styles.unit}>Hz</span>
                <span className={styles.separator}>/</span>
                {pitchCents != null ? `${pitchCents.toFixed(1)} ` : ""}
                <span className={styles.unit}>cents</span>
            </div>

            <div className={styles.rows}>
                <span className={styles.key}>Confidence</span>
                <span className={styles.val}>
                    {(confidence * 100).toFixed(1)}
                    <span className={styles.unit}>%</span>
                </span>

                <span className={styles.key}>Latency</span>
                <span className={styles.val}>
                    {Number.isFinite(latency) ? `${latency.toFixed(1)}` : "—"}
                    <span className={styles.unit}>ms</span>
                </span>
            </div>
        </div>,
        portalContainer
    );
}
