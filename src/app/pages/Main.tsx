import styles from "./Main.module.scss";
import PitchChart from "@/components/pitch_chart/PitchChart";
import PianoSlider from "@/components/piano_slider/PianoSlider";
import InfoCards from "@/components/info_cards/InfoCards";
import Footer from "@/components/footer/Footer";

export default function Main() {

    return (
        <div className={styles.container}>
            <div className={styles.section}>
                <InfoCards />
            </div>

            <div className={`${styles.section} `}>
                <PitchChart />
            </div>

            <div className={styles.section}>
                <PianoSlider />
            </div>

            <div className={styles.footer}>
                <Footer />
            </div>
            
        </div>
    );
}
