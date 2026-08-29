import Link from "next/link";

import styles from "./app-nav.module.css";

export function AppNav() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Primary navigation">
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark} aria-hidden="true">
            FL
          </span>
          <span>Fish Log Book</span>
        </Link>
        <div className={styles.links}>
          <Link href="/">App</Link>
          <Link href="/learn">Learn &amp; Build</Link>
        </div>
      </nav>
    </header>
  );
}
