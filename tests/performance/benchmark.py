"""Benchmark reporting for Dikoryx performance test runs."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tests.performance.metrics import MetricsSummary, system_metrics_summary


@dataclass
class BenchmarkResult:
    run_id: str
    timestamp: str
    agent_count: int
    duration_sec: float
    base_url: str
    total_requests: int
    successful_requests: int
    failed_requests: int
    failure_rate: float
    requests_per_sec: float
    average_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    total_runtime_sec: float
    system_metrics: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def build_benchmark_result(
    *,
    run_id: str,
    agent_count: int,
    duration_sec: float,
    base_url: str,
    metrics: MetricsSummary,
) -> BenchmarkResult:
    return BenchmarkResult(
        run_id=run_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        agent_count=agent_count,
        duration_sec=duration_sec,
        base_url=base_url,
        total_requests=metrics.total_requests,
        successful_requests=metrics.successful_requests,
        failed_requests=metrics.failed_requests,
        failure_rate=round(metrics.failure_rate * 100, 2),
        requests_per_sec=round(metrics.requests_per_sec, 2),
        average_latency_ms=round(metrics.average_latency_ms, 2),
        p95_latency_ms=round(metrics.p95_latency_ms, 2),
        p99_latency_ms=round(metrics.p99_latency_ms, 2),
        total_runtime_sec=round(metrics.total_runtime_sec, 2),
        system_metrics=system_metrics_summary(metrics.system_samples),
    )


def print_console_summary(result: BenchmarkResult) -> None:
    print("\n=== Dikoryx Performance Benchmark ===")
    print(f"Run ID:              {result.run_id}")
    print(f"Agents:              {result.agent_count}")
    print(f"Duration:            {result.duration_sec:.0f}s")
    print(f"Total requests:      {result.total_requests}")
    print(f"Successful:          {result.successful_requests}")
    print(f"Failed:              {result.failed_requests}")
    print(f"Failure rate:        {result.failure_rate:.2f}%")
    print(f"Requests/sec:        {result.requests_per_sec:.2f}")
    print(f"Average latency:     {result.average_latency_ms:.2f} ms")
    print(f"P95 latency:         {result.p95_latency_ms:.2f} ms")
    print(f"P99 latency:         {result.p99_latency_ms:.2f} ms")
    print(f"Total runtime:       {result.total_runtime_sec:.2f} s")
    if result.system_metrics.get("sample_count", 0):
        print("System metrics:")
        print(f"  CPU avg/max:       {result.system_metrics['cpu_percent_avg']}% / {result.system_metrics['cpu_percent_max']}%")
        print(f"  Memory avg/max:    {result.system_metrics['memory_mb_avg']} MB / {result.system_metrics['memory_mb_max']} MB")
        print(f"  Threads max:       {result.system_metrics['thread_count_max']}")
        print(f"  Connections max:   {result.system_metrics['open_connections_max']}")


def export_json(result: BenchmarkResult, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result.to_dict(), indent=2), encoding="utf-8")
    return output_path


def export_markdown(result: BenchmarkResult, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Dikoryx Performance Benchmark",
        "",
        f"- **Run ID:** `{result.run_id}`",
        f"- **Timestamp (UTC):** {result.timestamp}",
        f"- **Agents:** {result.agent_count}",
        f"- **Configured duration:** {result.duration_sec:.0f}s",
        f"- **Base URL:** `{result.base_url}`",
        "",
        "## Request Metrics",
        "",
        "| Metric | Value |",
        "| --- | ---: |",
        f"| Total requests | {result.total_requests} |",
        f"| Successful requests | {result.successful_requests} |",
        f"| Failed requests | {result.failed_requests} |",
        f"| Failure rate | {result.failure_rate:.2f}% |",
        f"| Requests/sec | {result.requests_per_sec:.2f} |",
        f"| Average latency | {result.average_latency_ms:.2f} ms |",
        f"| P95 latency | {result.p95_latency_ms:.2f} ms |",
        f"| P99 latency | {result.p99_latency_ms:.2f} ms |",
        f"| Total runtime | {result.total_runtime_sec:.2f} s |",
        "",
    ]
    if result.system_metrics.get("sample_count", 0):
        lines.extend(
            [
                "## System Metrics",
                "",
                "| Metric | Value |",
                "| --- | ---: |",
                f"| CPU avg | {result.system_metrics['cpu_percent_avg']}% |",
                f"| CPU max | {result.system_metrics['cpu_percent_max']}% |",
                f"| Memory avg | {result.system_metrics['memory_mb_avg']} MB |",
                f"| Memory max | {result.system_metrics['memory_mb_max']} MB |",
                f"| Thread count max | {result.system_metrics['thread_count_max']} |",
                f"| Open connections max | {result.system_metrics['open_connections_max']} |",
                "",
            ]
        )
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path
