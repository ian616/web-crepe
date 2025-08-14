import styles from "./InfoCards.module.scss";
import { Button } from "@/components/ui/button";
import { FaPlay, FaPause } from "react-icons/fa";
import { useState } from "react";
import { startMIC, stopMIC } from "../../../lib/infer_mic";
import { useInferStore } from "@/stores/inferStore";
import CoreSelect from "./CoreSelect";
import ModelSelect from "./ModelSelect";

function InfoCards() {
    const [isPlaying, setIsPlaying] = useState(false);

    const handleClick = () => {
        if (useInferStore.getState().isLoading) return; // 로딩 중이면 클릭 무시
        useInferStore.setState({ isLoading: true });

        setIsPlaying((prev) => {
            const next = !prev;
            if (next) {
                startMIC(); 
            } else {
                stopMIC(); 
            }
            return next;
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.playButton}>
                <Button
                    size="default"
                    variant="default"
                    onClick={handleClick}
                    className={` ${isPlaying ? styles.isPause : styles.isPlay}`}
                >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                </Button>
            </div>
            <CoreSelect />
            <ModelSelect />
        </div>
    );
}

export default InfoCards;
