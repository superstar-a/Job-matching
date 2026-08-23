from __future__ import annotations

import statistics
import time
import tracemalloc
from dataclasses import dataclass, field
from typing import Any, Callable


Operation = Callable[[], Any]
ResultSummarizer = Callable[[Any], dict[str, Any]]


@dataclass(frozen=True)
class BenchmarkCase:
    name: str
    flow: str
    operation: Operation
    summarize_result: ResultSummarizer | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class BenchmarkResult:
    name: str
    flow: str
    iterations: int
    warmup_iterations: int
    latency_samples_ms: list[float]
    min_ms: float
    max_ms: float
    mean_ms: float
    p50_ms: float
    p95_ms: float
    peak_memory_kb: float
    output_summary: dict[str, Any]
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class BenchmarkReport:
    benchmark_name: str
    iterations: int
    warmup_iterations: int
    results: list[BenchmarkResult]
    metadata: dict[str, Any] = field(default_factory=dict)


def run_benchmark_cases(
    cases: list[BenchmarkCase],
    *,
    iterations: int = 20,
    warmup_iterations: int = 3,
    benchmark_name: str = "ai-service-runtime",
    metadata: dict[str, Any] | None = None,
) -> BenchmarkReport:
    if iterations <= 0:
        raise ValueError("iterations must be greater than 0")
    if warmup_iterations < 0:
        raise ValueError("warmup_iterations must be greater than or equal to 0")

    results = [
        run_single_case(case, iterations=iterations, warmup_iterations=warmup_iterations)
        for case in cases
    ]
    return BenchmarkReport(
        benchmark_name=benchmark_name,
        iterations=iterations,
        warmup_iterations=warmup_iterations,
        results=results,
        metadata=metadata or {},
    )


def run_single_case(
    case: BenchmarkCase,
    *,
    iterations: int,
    warmup_iterations: int,
) -> BenchmarkResult:
    for _ in range(warmup_iterations):
        case.operation()

    latency_samples: list[float] = []
    last_result: Any = None

    tracemalloc.start()
    try:
        for _ in range(iterations):
            start = time.perf_counter()
            last_result = case.operation()
            elapsed_ms = (time.perf_counter() - start) * 1000
            latency_samples.append(elapsed_ms)
        _, peak_bytes = tracemalloc.get_traced_memory()
    finally:
        tracemalloc.stop()

    output_summary = (
        case.summarize_result(last_result)
        if case.summarize_result is not None
        else {"result_type": type(last_result).__name__}
    )

    return BenchmarkResult(
        name=case.name,
        flow=case.flow,
        iterations=iterations,
        warmup_iterations=warmup_iterations,
        latency_samples_ms=[round(value, 4) for value in latency_samples],
        min_ms=round(min(latency_samples), 4),
        max_ms=round(max(latency_samples), 4),
        mean_ms=round(statistics.fmean(latency_samples), 4),
        p50_ms=round(percentile(latency_samples, 50), 4),
        p95_ms=round(percentile(latency_samples, 95), 4),
        peak_memory_kb=round(peak_bytes / 1024, 4),
        output_summary=output_summary,
        metadata=case.metadata,
    )


def percentile(values: list[float], percent: float) -> float:
    if not values:
        raise ValueError("values must not be empty")
    if not 0 <= percent <= 100:
        raise ValueError("percent must be between 0 and 100")

    sorted_values = sorted(float(value) for value in values)
    if len(sorted_values) == 1:
        return sorted_values[0]

    rank = (percent / 100) * (len(sorted_values) - 1)
    lower_index = int(rank)
    upper_index = min(lower_index + 1, len(sorted_values) - 1)
    weight = rank - lower_index
    lower = sorted_values[lower_index]
    upper = sorted_values[upper_index]
    return lower + ((upper - lower) * weight)
