import unittest

from app.services.esco_taxonomy import load_esco_taxonomy


class EscoTaxonomyTests(unittest.TestCase):
    def test_resolves_skill_aliases_to_esco_uri(self):
        taxonomy = load_esco_taxonomy()

        concept = taxonomy.resolve_skill("py")

        self.assertIsNotNone(concept)
        self.assertEqual(
            concept.uri,
            "http://data.europa.eu/esco/skill/ccd0a1d9-afda-43d9-b901-96344886e14d",
        )
        self.assertEqual(concept.preferred_label, "Python (computer programming)")
        self.assertEqual(concept.concept_type, "skill")
        self.assertEqual(concept.skill_type, "knowledge")

    def test_resolves_longest_skill_alias_before_shorter_alias(self):
        taxonomy = load_esco_taxonomy()

        concepts = taxonomy.find_skills("SQL Server tuning and stored procedures")

        self.assertEqual(len(concepts), 1)
        concept = concepts[0]
        self.assertEqual(
            concept.uri,
            "http://data.europa.eu/esco/skill/c062bab3-3ea0-4291-9220-a2d8fef4bead",
        )
        self.assertEqual(concept.preferred_label, "SQL Server")

    def test_resolves_vietnamese_occupation_aliases(self):
        taxonomy = load_esco_taxonomy()

        concept = taxonomy.resolve_occupation("ky su du lieu")

        self.assertIsNotNone(concept)
        self.assertEqual(
            concept.uri,
            "http://data.europa.eu/esco/occupation/2079755f-d809-49e6-8037-4de6180e54c0",
        )
        self.assertEqual(concept.preferred_label, "data engineer")
        self.assertEqual(concept.isco_group, "2511")

    def test_builds_entity_metadata_for_schema_bridge(self):
        taxonomy = load_esco_taxonomy()

        metadata = taxonomy.resolve_entity_metadata("skill", "Microsoft SQL Server")

        self.assertEqual(
            metadata,
            {
                "esco_uri": "http://data.europa.eu/esco/skill/c062bab3-3ea0-4291-9220-a2d8fef4bead",
                "esco_preferred_label": "SQL Server",
                "esco_type": "skill",
                "isco_group": None,
            },
        )


if __name__ == "__main__":
    unittest.main()
