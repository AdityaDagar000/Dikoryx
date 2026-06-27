"""System and request metrics collection for Dikoryx performance tests."""

from __future__ import annotations

import statistics
import threading
import time
from dataclasses import dataclass, field
from typing import Any

try:
    import psutil
except ImportError:  # pragma: no cover - optional at runtime
    psutil = None  # type: ignore[assignment]


@dataclass
class ResponseSample:
    endpoint: str
    latency_ms: float
    success: bool
    status_code: int | None = None
    error: str | None = None


@dataclass
class SystemSample:
    timestamp: float
    cpu_percent: float
    memory_mb: float
    thread_count: int
    open_connections: int


@dataclass
class MetricsSummary:
    total_requests: int
    successful_requests: int
    failed_requests: int
    requests_per_sec: float
    average_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    total_runtime_sec: float
    response_times_ms: list[float] = field(repr=False)
    system_samples: list[SystemSample] = field(default_factory=list, repr=False)

    @property
    def failure_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.failed_requests / self.total_requests


class MetricsCollector:
    """Thread-safe collector for backend response times and host resource usage."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._samples: list[ResponseSample] = []
        self._system_samples: list[SystemSample] = []
        self._started_at: float | None = None
        self._stopped_at: float | None = None
        self._process = psutil.Process() if psutil is not None else None

    def start(self) -> None:
        with self._lock:
            self._started_at = time.perf_counter()

    def stop(self) -> None:
        with self._lock:
            self._stopped_at = time.perf_counter()

    def record_response(
        self,
        *,
        endpoint: str,
        latency_ms: float,
        success: bool,
        status_code: int | None = None,
        error: str | None = None,
    ) -> None:
        sample = ResponseSample(
            endpoint=endpoint,
            latency_ms=latency_ms,
            success=success,
            status_code=status_code,
            error=error,
        )
        with self._lock:
            self._samples.append(sample)

    def sample_system(self) -> SystemSample | None:
        if self._process is None or psutil is None:
            return None
        try:
            cpu = self._process.cpu_percent(interval=None)
            memory = self._process.memory_info().rss / (1024 * 1024)
            threads = self._process.num_threads()
            connections = len(self._process.net_connections(kind="inet"))
        except (psutil.Error, OSError):
            return None
        sample = SystemSample(
            timestamp=time.time(),
            cpu_percent=cpu,
            memory_mb=memory,
            thread_count=threads,
            open_connections=connections,
        )
        with self._lock:
            self._system_samples.append(sample)
        return sample

    def summarize(self) -> MetricsSummary:
        with self._lock:
            samples = list(self._samples)
            system_samples = list(self._system_samples)
            started = self._started_at
            stopped = self._stopped_at

        runtime = 0.0
        if started is not None and stopped is not None:
            runtime = stopped - started

        latencies = [sample.latency_ms for sample in samples]
        successes = sum(1 for sample in samples if sample.success)
        failures = len(samples) - successes
        rps = len(samples) / runtime if runtime > 0 else 0.0

        return MetricsSummary(
            total_requests=len(samples),
            successful_requests=successes,
            failed_requests=failures,
            requests_per_sec=rps,
            average_latency_ms=statistics.mean(latencies) if latencies else 0.0,
            p95_latency_ms=_percentile(latencies, 0.95),
            p99_latency_ms=_percentile(latencies, 0.99),
            total_runtime_sec=runtime,
            response_times_ms=latencies,
            system_samples=system_samples,
        )


def _percentile(values: list[float], fraction: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = (len(ordered) - 1) * fraction
    lower = int(index)
    upper = min(lower + 1, len(ordered) - 1)
    weight = index - lower
    return ordered[lower] + (ordered[upper] - ordered[lower]) * weight


def system_metrics_summary(samples: list[SystemSample]) -> dict[str, Any]:
    if not samples:
        return {
            "cpu_percent_avg": 0.0,
            "cpu_percent_max": 0.0,
            "memory_mb_avg": 0.0,
            "memory_mb_max": 0.0,
            "thread_count_max": 0,
            "open_connections_max": 0,
            "sample_count": 0,
        }
    return {
        "cpu_percent_avg": round(statistics.mean(s.cpu_percent for s in samples), 2),
        "cpu_percent_max": round(max(s.cpu_percent for s in samples), 2),
        "memory_mb_avg": round(statistics.mean(s.memory_mb for s in samples), 2),
        "memory_mb_max": round(max(s.memory_mb for s in samples), 2),
        "thread_count_max": max(s.thread_count for s in samples),
        "open_connections_max": max(s.open_connections for s in samples),
        "sample_count": len(samples),
    }
