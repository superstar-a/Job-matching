import hashlib
import os
import re
import sqlite3
from contextlib import contextmanager
from typing import Optional


def _normalize_key_part(value: Optional[str]) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value.strip().lower())


def build_job_fingerprint(
    title: Optional[str],
    company_name: Optional[str],
    location: Optional[str],
) -> Optional[str]:
    """Build a stable duplicate key from normalized JD identity fields."""

    parts = [
        _normalize_key_part(title),
        _normalize_key_part(company_name),
        _normalize_key_part(location),
    ]
    if not all(parts):
        return None

    raw_key = "|".join(parts)
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


class JobDeduplicator:
    def __init__(self, db_path: str = "data/scraped_jobs.db"):
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        self.db_path = db_path
        self._init_db()

    @contextmanager
    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS scraped_urls (
                    url TEXT PRIMARY KEY,
                    external_id TEXT,
                    fingerprint TEXT,
                    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            self._ensure_column(cursor, "external_id")
            self._ensure_column(cursor, "fingerprint")
            cursor.execute(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS idx_scraped_urls_external_id
                ON scraped_urls(external_id)
                WHERE external_id IS NOT NULL
                """
            )
            cursor.execute(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS idx_scraped_urls_fingerprint
                ON scraped_urls(fingerprint)
                WHERE fingerprint IS NOT NULL
                """
            )
            conn.commit()

    def _ensure_column(self, cursor: sqlite3.Cursor, column_name: str) -> None:
        cursor.execute("PRAGMA table_info(scraped_urls)")
        existing_columns = {row[1] for row in cursor.fetchall()}
        if column_name not in existing_columns:
            cursor.execute(f"ALTER TABLE scraped_urls ADD COLUMN {column_name} TEXT")

    def is_scraped(self, url: str) -> bool:
        """Backward-compatible URL-only duplicate check."""

        return self.is_duplicate(url=url)

    def is_duplicate(
        self,
        url: str,
        external_id: Optional[str] = None,
        fingerprint: Optional[str] = None,
    ) -> bool:
        """Check duplicates by URL, source external ID, or job fingerprint."""

        conditions = ["url = ?"]
        params = [url]
        if external_id:
            conditions.append("external_id = ?")
            params.append(external_id)
        if fingerprint:
            conditions.append("fingerprint = ?")
            params.append(fingerprint)

        query = f"SELECT 1 FROM scraped_urls WHERE {' OR '.join(conditions)} LIMIT 1"
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchone() is not None

    def mark_as_scraped(
        self,
        url: str,
        external_id: Optional[str] = None,
        fingerprint: Optional[str] = None,
    ) -> None:
        """Mark a successfully scraped URL and any available duplicate keys."""

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR IGNORE INTO scraped_urls (url, external_id, fingerprint)
                VALUES (?, ?, ?)
                """,
                (url, external_id, fingerprint),
            )
            self._update_key_if_available(cursor, url, "external_id", external_id)
            self._update_key_if_available(cursor, url, "fingerprint", fingerprint)
            conn.commit()

    def _update_key_if_available(
        self,
        cursor: sqlite3.Cursor,
        url: str,
        column_name: str,
        value: Optional[str],
    ) -> None:
        if not value:
            return
        try:
            cursor.execute(
                f"""
                UPDATE scraped_urls
                SET {column_name} = COALESCE({column_name}, ?)
                WHERE url = ?
                """,
                (value, url),
            )
        except sqlite3.IntegrityError:
            pass


deduplicator = JobDeduplicator()
