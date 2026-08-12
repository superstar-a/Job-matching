import json
from pathlib import Path

from app.schemas.jd import JDResponse


SAMPLES_PATH = Path("data/samples/jd_samples_20.json")


def test_jd_sample_dataset_has_at_least_20_valid_records():
    records = json.loads(SAMPLES_PATH.read_text(encoding="utf-8"))

    assert len(records) >= 20

    seen_urls = set()
    seen_external_ids = set()
    for record in records:
        jd = JDResponse.model_validate(record)

        assert jd.crawl_status == "success"
        assert jd.source
        assert jd.source_url not in seen_urls
        assert jd.external_id not in seen_external_ids
        assert jd.title
        assert jd.company_name
        assert jd.location
        assert jd.description_text
        assert jd.requirements_text
        assert jd.benefits_text

        seen_urls.add(jd.source_url)
        seen_external_ids.add(jd.external_id)
