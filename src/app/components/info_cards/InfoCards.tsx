import styles from "./InfoCards.module.scss";
import { Button } from "@/components/ui/button";
import { FaPlay, FaPause } from "react-icons/fa";
import { useInferStore } from "@/stores/inferStore";
import CoreSelect from "./CoreSelect";
import ModelSelect from "./ModelSelect";

function InfoCards() {
  const isLoading = useInferStore((s) => s.isLoading);
  const runState  = useInferStore((s) => s.state);        // "idle" | "ready" | "running"
  const start     = useInferStore((s) => s.start);
  const stop      = useInferStore((s) => s.stop);

  const handleClick = async () => {
    if (isLoading) return;            // 로딩 중엔 무시
    if (runState === "running") {
      await stop();                   // ⏸
    } else if (runState === "ready") {
      await start();                  // ▶️
    } else {
      console.warn("[InfoCards] Engine is idle. Select core/model to init first.");
    }
  };

  const isPlaying = runState === "running";
  const btnClass =
    isLoading
      ? styles.loading          // 로딩이면 무조건 loading만
      : isPlaying
      ? styles.isPause
      : styles.isPlay;

  return (
    <div className={styles.container}>
      <div className={styles.playButton}>
        <Button
          size="default"
          variant="default"
          onClick={handleClick}
          className={btnClass}
        >
          {isLoading ? (
            <span className={styles.dots} aria-hidden>
              <span></span><span></span><span></span>
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
  );
}

export default InfoCards;