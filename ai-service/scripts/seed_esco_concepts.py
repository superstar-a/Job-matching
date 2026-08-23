import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path


CONCEPT_COLUMNS = (
    "esco_uri",
    "preferred_label",
    "alt_labels_json",
    "concept_type",
    "isco_group",
    "broader_uri",
    "description_text",
    "source_version",
)

DEFAULT_SEED_PATH = (
    Path(__file__).resolve().parents[1] / "data" / "taxonomy" / "esco_seed.json"
)


def _sql_literal(value):
    if value is None:
        return "NULL"
    escaped = str(value).replace("'", "''")
    return f"N'{escaped}'"


def _json_array(values):
    cleaned = []
    seen = set()
    for value in values or []:
        if not isinstance(value, str):
            continue
        label = value.strip()
        key = label.casefold()
        if label and key not in seen:
            cleaned.append(label)
            seen.add(key)
    return json.dumps(cleaned, ensure_ascii=False)


def _description(*parts):
    return "; ".join(part for part in parts if part)


def _require_text(item, field, concept_type):
    value = item.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{concept_type} is missing required field '{field}'")
    return value.strip()


def build_concepts(seed):
    version = _require_text(seed, "version", "seed")
    source = seed.get("source", "")
    language = seed.get("language", "")

    rows = []
    seen_uris = set()

    for item in seed.get("skills", []):
        uri = _require_text(item, "uri", "skill")
        if uri in seen_uris:
            raise ValueError(f"Duplicate ESCO URI in seed: {uri}")
        seen_uris.add(uri)

        rows.append(
            {
                "esco_uri": uri,
                "preferred_label": _require_text(item, "preferred_label", "skill"),
                "alt_labels_json": _json_array(item.get("aliases", [])),
                "concept_type": "skill",
                "isco_group": None,
                "broader_uri": item.get("broader_uri"),
                "description_text": _description(
                    f"source={source}" if source else "",
                    f"language={language}" if language else "",
                    f"skill_type={item.get('skill_type')}" if item.get("skill_type") else "",
                    f"reuse_level={item.get('reuse_level')}" if item.get("reuse_level") else "",
                ),
                "source_version": version,
            }
        )

    for item in seed.get("occupations", []):
        uri = _require_text(item, "uri", "occupation")
        if uri in seen_uris:
            raise ValueError(f"Duplicate ESCO URI in seed: {uri}")
        seen_uris.add(uri)

        rows.append(
            {
                "esco_uri": uri,
                "preferred_label": _require_text(item, "preferred_label", "occupation"),
                "alt_labels_json": _json_array(item.get("aliases", [])),
                "concept_type": "occupation",
                "isco_group": item.get("isco_group"),
                "broader_uri": item.get("broader_uri"),
                "description_text": _description(
                    f"source={source}" if source else "",
                    f"language={language}" if language else "",
                    f"code={item.get('code')}" if item.get("code") else "",
                ),
                "source_version": version,
            }
        )

    if not rows:
        raise ValueError("ESCO seed does not contain any skills or occupations")

    return rows


def load_seed(path):
    with Path(path).open("r", encoding="utf-8") as file:
        return json.load(file)


def render_merge_sql(rows):
    values_sql = []
    for row in rows:
        literals = ", ".join(_sql_literal(row[column]) for column in CONCEPT_COLUMNS)
        values_sql.append(f"    ({literals})")

    values_block = ",\n".join(values_sql)
    source_columns = ", ".join(CONCEPT_COLUMNS)
    insert_columns = ", ".join(CONCEPT_COLUMNS)
    source_values = ", ".join(f"source.{column}" for column in CONCEPT_COLUMNS)

    return f"""SET XACT_ABORT ON;
BEGIN TRANSACTION;

MERGE ai_data.esco_concepts AS target
USING (VALUES
{values_block}
) AS source ({source_columns})
ON target.esco_uri = source.esco_uri
WHEN MATCHED THEN
    UPDATE SET
        preferred_label = source.preferred_label,
        alt_labels_json = source.alt_labels_json,
        concept_type = source.concept_type,
        isco_group = source.isco_group,
        broader_uri = source.broader_uri,
        description_text = source.description_text,
        source_version = source.source_version,
        updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT ({insert_columns})
    VALUES ({source_values});

COMMIT TRANSACTION;

PRINT 'Seeded ESCO concepts: {len(rows)}';
"""


def _env_default(name, default=None):
    value = os.getenv(name)
    return value if value not in (None, "") else default


def _default_server():
    host = _env_default("DB_HOST", "127.0.0.1")
    port = _env_default("DB_PORT")
    if "," in host or "\\" in host or not port:
        return host
    return f"{host},{port}"


def _build_sqlcmd_args(args, sql_path):
    command = [args.sqlcmd]
    if args.trust_server_certificate:
        command.append("-C")
    command.extend(["-S", args.server, "-d", args.database])
    if args.trusted_connection:
        command.append("-E")
    else:
        command.extend(["-U", args.user, "-P", args.password])
    command.extend(["-i", str(sql_path)])
    return command


def run_sqlcmd(args, sql):
    fd, temp_path = tempfile.mkstemp(prefix="esco_seed_", suffix=".sql")
    os.close(fd)
    path = Path(temp_path)
    try:
        path.write_text(sql, encoding="utf-8")
        result = subprocess.run(_build_sqlcmd_args(args, path), check=False)
        return result.returncode
    finally:
        path.unlink(missing_ok=True)


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description="Seed ai_data.esco_concepts from data/taxonomy/esco_seed.json."
    )
    parser.add_argument("--input", default=str(DEFAULT_SEED_PATH), help="ESCO seed JSON path.")
    parser.add_argument("--server", default=_default_server(), help="SQL Server name, e.g. 127.0.0.1,1433.")
    parser.add_argument("--database", default=_env_default("DB_NAME", "job_matching_db"))
    parser.add_argument("--user", default=_env_default("DB_USER", "sa"))
    parser.add_argument("--password", default=_env_default("DB_PASSWORD"))
    parser.add_argument("--trusted-connection", action="store_true", help="Use Windows trusted connection.")
    parser.add_argument("--trust-server-certificate", action="store_true", help="Pass -C to sqlcmd.")
    parser.add_argument("--sqlcmd", default=_env_default("SQLCMD", "sqlcmd"))
    parser.add_argument("--output", help="Write rendered SQL to this file.")
    parser.add_argument("--dry-run", action="store_true", help="Print SQL instead of executing sqlcmd.")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv or sys.argv[1:])
    if not args.trusted_connection and not args.password and not args.dry_run and not args.output:
        raise SystemExit("Missing DB password. Use --password or set DB_PASSWORD.")

    rows = build_concepts(load_seed(args.input))
    sql = render_merge_sql(rows)

    if args.output:
        Path(args.output).write_text(sql, encoding="utf-8")
        print(f"Wrote ESCO seed SQL: {args.output}")
        return 0

    if args.dry_run:
        print(sql)
        return 0

    return run_sqlcmd(args, sql)


if __name__ == "__main__":
    raise SystemExit(main())
