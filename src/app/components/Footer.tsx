import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";
import styles from "./Footer.module.scss";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <span className={styles.author}>2025 Sungwon Lee</span>
            <nav className={styles.nav}>
                <a
                    href="https://github.com/ian616/web-crepe"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <FaGithub />
                </a>
                <a
                    href="https://linkedin.com/in/yourprofile"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <FaLinkedin />
                </a>
                <a href="mailto:sung1lee@kaist.ac.kr">
                    <FaEnvelope /> 
                </a>
            </nav>
        </footer>
    );
}
