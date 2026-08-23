import pytest

from app.services.runtime_benchmark import (
    BenchmarkCase,
    percentile,
    run_benchmark_cases,
)


def test_percentile_uses_linear_interpolation_for_latency_samples():
    samples = [10.0, 20.0, 30.0, 40.0]

    assert percentile(samples, 50) == 25.0
    assert percentile(samples, 95) == 38.5
    assert percentile(samples, 0) == 10.0
    assert percentile(samples, 100) == 40.0


def test_run_benchmark_cases_records_only_measured_iterations_after_warmup():
    calls: list[str] = []

    def operation() -> dict[str, bool]:
        calls.append("called")
        return {"ok": True}

    report = run_benchmark_cases(
        [
            BenchmarkCase(
                name="sample-operation",
                flow="unit",
                operation=operation,
                summarize_result=lambda result: {"ok": result["ok"]},
            )
        ],
        iterations=3,
        warmup_iterations=2,
        benchmark_name="unit-runtime",
        metadata={"model_name": "rule-based-baseline"},
    )

    result = report.results[0]
    assert len(calls) == 5
    assert report.benchmark_name == "unit-runtime"
    assert report.metadata["model_name"] == "rule-based-baseline"
    assert result.name == "sample-operation"
    assert result.flow == "unit"
    assert result.iterations == 3
    assert result.warmup_iterations == 2
    assert len(result.latency_samples_ms) == 3
    assert result.min_ms <= result.p50_ms <= result.max_ms
    assert result.min_ms <= result.p95_ms <= result.max_ms
    assert result.mean_ms >= 0.0
    assert result.peak_memory_kb >= 0.0
    assert result.output_summary == {"ok": True}


def test_run_benchmark_cases_rejects_non_positive_iterations():
    with pytest.raises(ValueError, match="iterations"):
        run_benchmark_cases(
            [BenchmarkCase(name="invalid", flow="unit", operation=lambda: None)],
            iterations=0,
        )
