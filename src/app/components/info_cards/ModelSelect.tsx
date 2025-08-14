import * as React from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useInferStore } from "@/stores/inferStore";
import styles from "./ModelSelect.module.scss";

type Model = "tiny" | "medium" | "full";

export default function ModelSelect() {
    const model = useInferStore((s) => s.model as Model);

    return (
        <div className={styles.container}>
            <Select
                value={model}
                onValueChange={(v) => {
                    useInferStore.setState({ model: v as Model });
                }}
            >
                <SelectTrigger className={styles.trigger}>
                    <div>
                        <span className={styles.icon}>🧠</span>
                        <SelectValue placeholder="Select model" />
                    </div>
                </SelectTrigger>

                <SelectContent className={styles.content}>
                    <SelectGroup>
                        <SelectLabel className={styles.label}>
                            Inference Model
                        </SelectLabel>

                        <SelectItem className={styles.item} value="tiny">
                            Tiny (smallest, fastest)
                        </SelectItem>
                        <SelectItem className={styles.item} value="medium">
                            Medium (balanced)
                        </SelectItem>
                        <SelectItem className={styles.item} value="full">
                            Full (largest, most accurate)
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}
