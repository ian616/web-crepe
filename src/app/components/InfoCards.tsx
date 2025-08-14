import styles from "./InfoCards.module.scss";
import { Button } from "@/components/ui/button";
import { FaPlay, FaPause } from "react-icons/fa";
import { useState } from "react";
import { startMIC, stopMIC } from "../../lib/infer_mic";

function InfoCards() {
    const [isPlaying, setIsPlaying] = useState(false);

    const handleClick = () => {
        setIsPlaying((prev) => {
            const next = !prev;
            if (next) {
                startMIC(); // 마이크 추론 시작
            } else {
                stopMIC(); // 마이크 추론 중지
            }
            return next;
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.topControls}>
                <Button
                    size="sm"
                    variant="default"
                    onClick={handleClick}
                    className={`${styles.playButton} ${
                        isPlaying ? styles.isPause : styles.isPlay
                    }`}
                >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                </Button>
            </div>
        </div>
    );
}

export default InfoCards;
