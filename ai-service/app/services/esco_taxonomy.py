from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any


DEFAULT_ESCO_TAXONOMY_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "taxonomy" / "esco_seed.json"
)
_BOUNDARY = r"(?<![a-z0-9+#.]){}(?![a-z0-9+#.])"


@dataclass(frozen=True)
class EscoConcept:
    uri: str
    preferred_label: str
    concept_type: str
    aliases: tuple[str, ...]
    skill_type: str | None = None
    reuse_level: str | None = None
    isco_group: str | None = None
    code: str | None = None
    source: str | None = None

    @classmethod
    def from_record(
        cls,
        record: dict[str, Any],
        *,
        concept_type: str,
        source: str | None,
    ) -> "EscoConcept":
        aliases = [record["preferred_label"], *record.get("aliases", [])]
        return cls(
            uri=record["uri"],
            preferred_label=record["preferred_label"],
            concept_type=concept_type,
            aliases=tuple(dedupe_aliases(aliases)),
            skill_type=record.get("skill_type"),
            reuse_level=record.get("reuse_level"),
            isco_group=record.get("isco_group"),
            code=record.get("code"),
            source=source,
        )


class EscoTaxonomy:
    def __init__(self, concepts: list[EscoConcept]):
        self.concepts = tuple(concepts)
        self.skills = tuple(concept for concept in concepts if concept.concept_type == "skill")
        self.occupations = tuple(
            concept for concept in concepts if concept.concept_type == "occupation"
        )
        self._skill_alias_index = build_alias_index(self.skills)
        self._occupation_alias_index = build_alias_index(self.occupations)
        self._skill_aliases = sorted(
            self._skill_alias_index,
            key=lambda alias: (len(alias), alias),
            reverse=True,
        )
        self._occupation_aliases = sorted(
            self._occupation_alias_index,
            key=lambda alias: (len(alias), alias),
            reverse=True,
        )

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "EscoTaxonomy":
        source = payload.get("source")
        concepts: list[EscoConcept] = []
        concepts.extend(
            EscoConcept.from_record(record, concept_type="skill", source=source)
            for record in payload.get("skills", [])
        )
        concepts.extend(
            EscoConcept.from_record(record, concept_type="occupation", source=source)
            for record in payload.get("occupations", [])
        )
        return cls(concepts)

    def resolve_skill(self, value: str) -> EscoConcept | None:
        return self._skill_alias_index.get(normalize_alias(value))

    def resolve_occupation(self, value: str) -> EscoConcept | None:
        return self._occupation_alias_index.get(normalize_alias(value))

    def find_skills(self, text: str) -> list[EscoConcept]:
        return find_concepts(text, self._skill_aliases, self._skill_alias_index)

    def find_occupations(self, text: str) -> list[EscoConcept]:
        return find_concepts(
            text,
            self._occupation_aliases,
            self._occupation_alias_index,
        )

    def resolve_entity_metadata(self, entity_type: str, value: str) -> dict[str, str | None]:
        if entity_type == "skill":
            concept = self.resolve_skill(value)
        elif entity_type == "occupation":
            concept = self.resolve_occupation(value)
        else:
            concept = None

        if concept is None:
            return {
                "esco_uri": None,
                "esco_preferred_label": None,
                "esco_type": None,
                "isco_group": None,
            }

        return {
            "esco_uri": concept.uri,
            "esco_preferred_label": concept.preferred_label,
            "esco_type": concept.concept_type,
            "isco_group": concept.isco_group,
        }


@lru_cache(maxsize=8)
def load_esco_taxonomy(path: str | Path | None = None) -> EscoTaxonomy:
    taxonomy_path = Path(path) if path is not None else DEFAULT_ESCO_TAXONOMY_PATH
    payload = json.loads(taxonomy_path.read_text(encoding="utf-8"))
    return EscoTaxonomy.from_payload(payload)


def build_alias_index(concepts: tuple[EscoConcept, ...]) -> dict[str, EscoConcept]:
    index: dict[str, EscoConcept] = {}
    for concept in concepts:
        for alias in concept.aliases:
            normalized = normalize_alias(alias)
            if normalized:
                index[normalized] = concept
    return index


def find_concepts(
    text: str,
    aliases: list[str],
    alias_index: dict[str, EscoConcept],
) -> list[EscoConcept]:
    normalized_text = normalize_alias(text)
    if not normalized_text:
        return []

    occupied_spans: list[tuple[int, int]] = []
    found: list[EscoConcept] = []
    seen_uris: set[str] = set()

    for alias in aliases:
        pattern = _BOUNDARY.format(re.escape(alias).replace(r"\ ", r"\s+"))
        for match in re.finditer(pattern, normalized_text):
            span = match.span()
            if overlaps_any(span, occupied_spans):
                continue

            concept = alias_index[alias]
            occupied_spans.append(span)
            if concept.uri not in seen_uris:
                found.append(concept)
                seen_uris.add(concept.uri)

    return found


def overlaps_any(span: tuple[int, int], spans: list[tuple[int, int]]) -> bool:
    start, end = span
    return any(
        start < existing_end and end > existing_start
        for existing_start, existing_end in spans
    )


def dedupe_aliases(aliases: list[str]) -> list[str]:
    deduped: list[str] = []
    seen: set[str] = set()
    for alias in aliases:
        normalized = normalize_alias(alias)
        if not normalized or normalized in seen:
            continue
        deduped.append(alias)
        seen.add(normalized)
    return deduped


def normalize_alias(value: str) -> str:
    text = str(value or "").replace("\u0110", "D").replace("\u0111", "d")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.lower()
    text = re.sub(r"[^a-z0-9+#.]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()
