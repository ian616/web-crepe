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
import styles from "./CoreSelect.module.scss";

type Backend = "tvm" | "tfjs-webgpu" | "tfjs-webgl" | undefined;

export default function CoreSelect() {
    const backend = useInferStore((s) => s.backend as Backend);
    const setBackend = useInferStore((s) => s.setBackend)

    return (
        <div className={styles.container}>
            <Select
                value={backend  ?? ""}
                onValueChange={(v) => {
                    setBackend(v as Backend);
                }}
            >
                <SelectTrigger className={styles.trigger}>
                    <div>
                        <span className={styles.icon}>💿</span>
                        <SelectValue placeholder="Select Engine" />
                    </div>
                </SelectTrigger>

                <SelectContent className={styles.content}>
                    <SelectGroup>
                        <SelectLabel className={styles.label}>
                            Inference Engine
                        </SelectLabel>

                        <SelectItem className={styles.item} value="tvm">
                            TVM (fastest, native kernels)
                        </SelectItem>
                        <SelectItem className={styles.item} value="tfjs-webgpu">
                            TF.js - WebGPU
                        </SelectItem>
                        <SelectItem className={styles.item} value="tfjs-webgl">
                            TF.js - WebGL (fallback)
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}
