import json

from scripts.seed_esco_concepts import build_concepts, render_merge_sql


def test_build_concepts_maps_seed_skills_and_occupations_to_esco_rows():
    seed = {
        "version": "esco-test-version",
        "source": "ESCO fixture",
        "language": "en",
        "skills": [
            {
                "uri": "http://data.europa.eu/esco/skill/python",
                "preferred_label": "Python (computer programming)",
                "aliases": ["Python", "py"],
                "skill_type": "knowledge",
                "reuse_level": "sector-specific",
            }
        ],
        "occupations": [
            {
                "uri": "http://data.europa.eu/esco/occupation/data-engineer",
                "preferred_label": "data engineer",
                "aliases": ["data engineer", "ky su du lieu"],
                "isco_group": "2511",
                "code": "2511.20",
            }
        ],
    }

    rows = build_concepts(seed)

    assert rows == [
        {
            "esco_uri": "http://data.europa.eu/esco/skill/python",
            "preferred_label": "Python (computer programming)",
            "alt_labels_json": json.dumps(["Python", "py"], ensure_ascii=False),
            "concept_type": "skill",
            "isco_group": None,
            "broader_uri": None,
            "description_text": "source=ESCO fixture; language=en; skill_type=knowledge; reuse_level=sector-specific",
            "source_version": "esco-test-version",
        },
        {
            "esco_uri": "http://data.europa.eu/esco/occupation/data-engineer",
            "preferred_label": "data engineer",
            "alt_labels_json": json.dumps(
                ["data engineer", "ky su du lieu"], ensure_ascii=False
            ),
            "concept_type": "occupation",
            "isco_group": "2511",
            "broader_uri": None,
            "description_text": "source=ESCO fixture; language=en; code=2511.20",
            "source_version": "esco-test-version",
        },
    ]


def test_render_merge_sql_uses_idempotent_upsert_and_escapes_unicode_literals():
    rows = [
        {
            "esco_uri": "http://data.europa.eu/esco/skill/o'reilly",
            "preferred_label": "O'Reilly SQL",
            "alt_labels_json": json.dumps(["O'Reilly", "SQL"], ensure_ascii=False),
            "concept_type": "skill",
            "isco_group": None,
            "broader_uri": None,
            "description_text": "source=fixture; language=en",
            "source_version": "v1",
        }
    ]

    sql = render_merge_sql(rows)

    assert "MERGE ai_data.esco_concepts AS target" in sql
    assert "WHEN MATCHED THEN" in sql
    assert "WHEN NOT MATCHED THEN" in sql
    assert "N'http://data.europa.eu/esco/skill/o''reilly'" in sql
    assert "N'O''Reilly SQL'" in sql
    assert "NULL" in sql
