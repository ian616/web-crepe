import styles from "./Main.module.scss";
import PitchChart from "@/components/PitchChart";
import PianoSlider from "@/components/PianoSlider";
import InfoCards from "@/components/InfoCards";
import Footer from "@/components/Footer";


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
