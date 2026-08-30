import styles from "./SegmentedProgressBar.module.css";

type Segment = {
  label: string;
  value: number;
  colorVar: string;
};

export function SegmentedProgressBar({ segments }: { segments: Segment[] }) {
  return (
    <div>
      <div className={styles.bar}>
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={styles.segment}
            style={{ flexGrow: segment.value, background: `var(${segment.colorVar})` }}
          />
        ))}
      </div>
      <div className={styles.legend}>
        {segments.map((segment) => (
          <span key={segment.label} className={styles.legendItem}>
            <span
              className={styles.dot}
              style={{ background: `var(${segment.colorVar})` }}
            />
            {segment.label}
          </span>
        ))}
      </div>
    </div>
  );
}
