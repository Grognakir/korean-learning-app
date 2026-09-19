import type { ReactNode } from "react";
import styles from "./TrainerWorkspace.module.css";

export function TrainerWorkspace({ children }: { children: ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}
