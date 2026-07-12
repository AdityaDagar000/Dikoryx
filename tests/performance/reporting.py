"""Automated benchmark reporting: history, graphs, dashboard, and regression detection."""

from __future__ import annotations

import csv
import html
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from tests.performance.benchmark import BenchmarkResult
from tests.performance.environment import EnvironmentInfo

HISTORY_COLUMNS: tuple[str, ...] = (
    "Timestamp",
    "Git Commit Hash",
    "Branch",
    "Agents",
    "Duration",
    "Events",
    "Requests/sec",
    "Average Latency",
    "P95",
    "P99",
    "CPU Average",
    "CPU Maximum",
    "RAM Average",
    "RAM Maximum",
    "Thread Count",
    "Open Connections",
    "Success",
    "Failures",
)

REGRESSION_THRESHOLD = 0.10

GRAPH_SPECS: tuple[tuple[str, str, str], ...] = (
    ("agents_vs_average_latency", "Average Latency (ms)", "average_latency_ms"),
    ("agents_vs_p95", "P95 Latency (ms)", "p95_latency_ms"),
    ("agents_vs_cpu_usage", "CPU Usage (%)", "cpu_percent_avg"),
    ("agents_vs_memory_usage", "Memory Usage (MB)", "memory_mb_avg"),
    ("agents_vs_throughput", "Throughput (req/s)", "requests_per_sec"),
)


@dataclass
class RegressionWarning:
    metric: str
    agent_count: int
    current: float
    previous: float
    change_percent: float
    direction: str

    def format_message(self) -> str:
        return (
            f"[REGRESSION] {self.metric} at {self.agent_count} agents: "
            f"{self.previous:.2f} -> {self.current:.2f} "
            f"({self.change_percent:+.1f}% {self.direction})"
        )


def history_csv_path(output_dir: Path) -> Path:
    return output_dir / "history.csv"


def graphs_dir(output_dir: Path) -> Path:
    return output_dir / "graphs"


def result_to_history_row(result: BenchmarkResult) -> dict[str, Any]:
    sys_m = result.system_metrics
    return {
        "Timestamp": result.timestamp,
        "Git Commit Hash": result.git_commit_hash,
        "Branch": result.git_branch,
        "Agents": result.agent_count,
        "Duration": result.duration_sec,
        "Events": result.total_events,
        "Requests/sec": result.requests_per_sec,
        "Average Latency": result.average_latency_ms,
        "P95": result.p95_latency_ms,
        "P99": result.p99_latency_ms,
        "CPU Average": sys_m.get("cpu_percent_avg", 0.0),
        "CPU Maximum": sys_m.get("cpu_percent_max", 0.0),
        "RAM Average": sys_m.get("memory_mb_avg", 0.0),
        "RAM Maximum": sys_m.get("memory_mb_max", 0.0),
        "Thread Count": sys_m.get("thread_count_max", 0),
        "Open Connections": sys_m.get("open_connections_max", 0),
        "Success": result.successful_requests,
        "Failures": result.failed_requests,
    }


def append_to_history(result: BenchmarkResult, output_dir: Path) -> Path:
    path = history_csv_path(output_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    row = result_to_history_row(result)
    write_header = not path.exists() or path.stat().st_size == 0
    with path.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=HISTORY_COLUMNS)
        if write_header:
            writer.writeheader()
        writer.writerow(row)
    return path


def load_history(output_dir: Path) -> list[dict[str, Any]]:
    path = history_csv_path(output_dir)
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def _parse_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _parse_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def find_previous_row(
    history: list[dict[str, Any]],
    *,
    agent_count: int,
    exclude_timestamp: str | None = None,
) -> dict[str, Any] | None:
    matches = [
        row
        for row in history
        if _parse_int(row.get("Agents")) == agent_count
        and row.get("Timestamp") != exclude_timestamp
    ]
    if not matches:
        return None
    return matches[-1]


def detect_regressions(
    results: Iterable[BenchmarkResult],
    output_dir: Path,
) -> list[RegressionWarning]:
    history = load_history(output_dir)
    warnings: list[RegressionWarning] = []

    for result in results:
        previous = find_previous_row(
            history,
            agent_count=result.agent_count,
            exclude_timestamp=result.timestamp,
        )
        if previous is None:
            continue

        checks = [
            ("Average Latency", result.average_latency_ms, _parse_float(previous.get("Average Latency")), "increase", True),
            ("P95 Latency", result.p95_latency_ms, _parse_float(previous.get("P95")), "increase", True),
            ("CPU Average", result.system_metrics.get("cpu_percent_avg", 0.0), _parse_float(previous.get("CPU Average")), "increase", True),
            ("RAM Average", result.system_metrics.get("memory_mb_avg", 0.0), _parse_float(previous.get("RAM Average")), "increase", True),
            ("Throughput", result.requests_per_sec, _parse_float(previous.get("Requests/sec")), "decrease", False),
        ]

        for metric, current, prev, direction, higher_is_bad in checks:
            if prev <= 0:
                continue
            if higher_is_bad:
                change = (current - prev) / prev
                degraded = change > REGRESSION_THRESHOLD
            else:
                change = (prev - current) / prev
                degraded = change > REGRESSION_THRESHOLD
            if degraded:
                signed = ((current - prev) / prev) * 100
                warnings.append(
                    RegressionWarning(
                        metric=metric,
                        agent_count=result.agent_count,
                        current=current,
                        previous=prev,
                        change_percent=signed,
                        direction=direction,
                    )
                )
    return warnings


def print_regression_warnings(warnings: list[RegressionWarning]) -> None:
    if not warnings:
        print("\n[REPORT] No regressions detected (>10% threshold).")
        return
    print(f"\n[REPORT] {len(warnings)} regression warning(s) detected:")
    for warning in warnings:
        print(f"  WARNING: {warning.format_message()}")


def _metric_value(result: BenchmarkResult, field: str) -> float:
    if field in ("average_latency_ms", "p95_latency_ms", "p99_latency_ms", "requests_per_sec"):
        return float(getattr(result, field))
    return float(result.system_metrics.get(field, 0.0))


def generate_graphs(results: list[BenchmarkResult], output_dir: Path) -> list[Path]:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    if not results:
        return []

    out_dir = graphs_dir(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    sorted_results = sorted(results, key=lambda item: item.agent_count)
    agents = [result.agent_count for result in sorted_results]
    written: list[Path] = []

    for filename, ylabel, field in GRAPH_SPECS:
        values = [_metric_value(result, field) for result in sorted_results]
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.plot(agents, values, marker="o", linewidth=2, color="#2563eb")
        ax.set_xlabel("Agents")
        ax.set_ylabel(ylabel)
        ax.set_title(f"Agents vs {ylabel.split('(')[0].strip()}")
        ax.grid(True, alpha=0.3)
        fig.tight_layout()
        path = out_dir / f"{filename}.png"
        fig.savefig(path, dpi=120)
        plt.close(fig)
        written.append(path)

    return written


def generate_suite_markdown(
    results: list[BenchmarkResult],
    environment: EnvironmentInfo,
    config: dict[str, Any],
    output_dir: Path,
    *,
    graph_paths: list[Path] | None = None,
    warnings: list[RegressionWarning] | None = None,
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    report_path = output_dir / f"benchmark_report_{timestamp}.md"
    latest_path = output_dir / "latest_benchmark_report.md"

    lines = [
        "# Dikoryx Automated Benchmark Report",
        "",
        f"**Generated:** {datetime.now(timezone.utc).isoformat()}",
        "",
        "## Environment",
        "",
        "| Property | Value |",
        "| --- | --- |",
        f"| Python | {environment.python_version} |",
        f"| OS | {environment.os_name} {environment.os_release} |",
        f"| CPU | {environment.cpu_model} ({environment.cpu_count} cores) |",
        f"| RAM | {environment.ram_total_gb} GB |",
        f"| Database | `{environment.database}` |",
        f"| Git commit | `{environment.git_commit_hash[:12]}` |",
        f"| Git branch | `{environment.git_branch}` |",
        "",
        "## Test Configuration",
        "",
        "| Setting | Value |",
        "| --- | --- |",
    ]
    for key, value in config.items():
        lines.append(f"| {key} | {value} |")

    lines.extend(["", "## Results Summary", ""])
    lines.extend(
        [
            "| Agents | Duration | Events | Req/s | Avg Latency | P95 | P99 | Success | Failures |",
            "| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
        ]
    )
    for result in sorted(results, key=lambda item: item.agent_count):
        lines.append(
            f"| {result.agent_count} | {result.duration_sec:.0f}s | {result.total_events} "
            f"| {result.requests_per_sec:.2f} | {result.average_latency_ms:.2f} ms "
            f"| {result.p95_latency_ms:.2f} ms | {result.p99_latency_ms:.2f} ms "
            f"| {result.successful_requests} | {result.failed_requests} |"
        )

    if warnings:
        lines.extend(["", "## Regression Warnings", ""])
        for warning in warnings:
            lines.append(f"- {warning.format_message()}")

    if graph_paths:
        lines.extend(["", "## Graphs", ""])
        for graph_path in graph_paths:
            rel = graph_path.relative_to(output_dir).as_posix()
            title = graph_path.stem.replace("_", " ").title()
            lines.append(f"### {title}")
            lines.append("")
            lines.append(f"![{title}]({rel})")
            lines.append("")

    content = "\n".join(lines)
    report_path.write_text(content, encoding="utf-8")
    latest_path.write_text(content, encoding="utf-8")
    return report_path


def generate_html_dashboard(
    results: list[BenchmarkResult],
    environment: EnvironmentInfo,
    config: dict[str, Any],
    output_dir: Path,
    *,
    graph_paths: list[Path] | None = None,
    warnings: list[RegressionWarning] | None = None,
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    dashboard_path = output_dir / "dashboard.html"
    history = load_history(output_dir)
    latest = max(results, key=lambda item: item.timestamp) if results else None
    graph_paths = graph_paths or []

    def esc(value: Any) -> str:
        return html.escape(str(value))

    history_rows = ""
    for row in reversed(history[-50:]):
        history_rows += "<tr>"
        for column in HISTORY_COLUMNS:
            history_rows += f"<td>{esc(row.get(column, ''))}</td>"
        history_rows += "</tr>\n"

    warning_html = ""
    if warnings:
        items = "".join(f"<li>{esc(w.format_message())}</li>" for w in warnings)
        warning_html = f'<section class="warnings"><h2>Regression Warnings</h2><ul>{items}</ul></section>'

    latest_html = "<p>No benchmark results in this run.</p>"
    if latest is not None:
        latest_html = f"""
        <table>
          <tr><th>Run ID</th><td>{esc(latest.run_id)}</td></tr>
          <tr><th>Timestamp</th><td>{esc(latest.timestamp)}</td></tr>
          <tr><th>Agents</th><td>{esc(latest.agent_count)}</td></tr>
          <tr><th>Duration</th><td>{esc(latest.duration_sec)}s</td></tr>
          <tr><th>Events</th><td>{esc(latest.total_events)}</td></tr>
          <tr><th>Requests/sec</th><td>{esc(latest.requests_per_sec)}</td></tr>
          <tr><th>Average Latency</th><td>{esc(latest.average_latency_ms)} ms</td></tr>
          <tr><th>P95</th><td>{esc(latest.p95_latency_ms)} ms</td></tr>
          <tr><th>P99</th><td>{esc(latest.p99_latency_ms)} ms</td></tr>
          <tr><th>Success / Failures</th><td>{esc(latest.successful_requests)} / {esc(latest.failed_requests)}</td></tr>
        </table>
        """

    config_rows = "".join(
        f"<tr><th>{esc(key)}</th><td>{esc(value)}</td></tr>" for key, value in config.items()
    )

    graph_html = ""
    for graph_path in graph_paths:
        rel = graph_path.relative_to(output_dir).as_posix()
        title = graph_path.stem.replace("_", " ").title()
        graph_html += f"""
        <div class="graph-card">
          <h3>{esc(title)}</h3>
          <img src="{esc(rel)}" alt="{esc(title)}">
        </div>
        """

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dikoryx Performance Dashboard</title>
  <style>
    :root {{
      --bg: #0f172a;
      --panel: #1e293b;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --warn: #fbbf24;
      --border: #334155;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: "Segoe UI", system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }}
    header {{
      padding: 1.5rem 2rem;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(135deg, #1e293b, #0f172a);
    }}
    header h1 {{ margin: 0 0 0.25rem; font-size: 1.75rem; }}
    header p {{ margin: 0; color: var(--muted); }}
    main {{ padding: 1.5rem 2rem 3rem; max-width: 1400px; margin: 0 auto; }}
    section {{
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
    }}
    h2 {{ margin-top: 0; color: var(--accent); font-size: 1.2rem; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 0.9rem; }}
    th, td {{ padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); text-align: left; }}
    th {{ color: var(--muted); font-weight: 600; width: 220px; }}
    .history-wrap {{ overflow-x: auto; }}
    .history-wrap table th, .history-wrap table td {{ white-space: nowrap; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }}
    .graph-card img {{ width: 100%; border-radius: 6px; background: #fff; }}
    .warnings ul {{ margin: 0; padding-left: 1.25rem; color: var(--warn); }}
  </style>
</head>
<body>
  <header>
    <h1>Dikoryx Performance Dashboard</h1>
    <p>Generated {esc(datetime.now(timezone.utc).isoformat())}</p>
  </header>
  <main>
    {warning_html}
    <section>
      <h2>Latest Benchmark</h2>
      {latest_html}
    </section>
    <section>
      <h2>Hardware &amp; Environment</h2>
      <table>
        <tr><th>Python</th><td>{esc(environment.python_version)}</td></tr>
        <tr><th>OS</th><td>{esc(environment.os_name)} {esc(environment.os_release)}</td></tr>
        <tr><th>CPU</th><td>{esc(environment.cpu_model)} ({esc(environment.cpu_count)} cores)</td></tr>
        <tr><th>RAM</th><td>{esc(environment.ram_total_gb)} GB</td></tr>
        <tr><th>Database</th><td><code>{esc(environment.database)}</code></td></tr>
        <tr><th>Git Commit</th><td><code>{esc(environment.git_commit_hash)}</code></td></tr>
        <tr><th>Git Branch</th><td><code>{esc(environment.git_branch)}</code></td></tr>
      </table>
    </section>
    <section>
      <h2>Test Configuration</h2>
      <table>{config_rows}</table>
    </section>
    <section>
      <h2>Benchmark Graphs</h2>
      <div class="grid">{graph_html or "<p>No graphs generated.</p>"}</div>
    </section>
    <section class="history-wrap">
      <h2>Historical Benchmarks</h2>
      <table>
        <thead><tr>{"".join(f"<th>{esc(col)}</th>" for col in HISTORY_COLUMNS)}</tr></thead>
        <tbody>{history_rows or "<tr><td colspan='18'>No history recorded yet.</td></tr>"}</tbody>
      </table>
    </section>
  </main>
</body>
</html>
"""
    dashboard_path.write_text(page, encoding="utf-8")
    return dashboard_path


def generate_full_report(
    results: list[BenchmarkResult],
    environment: EnvironmentInfo,
    config: dict[str, Any],
    output_dir: Path,
) -> dict[str, Path]:
    """Generate graphs, suite markdown, and HTML dashboard for a benchmark session."""
    warnings = detect_regressions(results, output_dir)
    graph_paths = generate_graphs(results, output_dir)
    md_path = generate_suite_markdown(
        results,
        environment,
        config,
        output_dir,
        graph_paths=graph_paths,
        warnings=warnings,
    )
    html_path = generate_html_dashboard(
        results,
        environment,
        config,
        output_dir,
        graph_paths=graph_paths,
        warnings=warnings,
    )

    print(f"[REPORT] Markdown report: {md_path}")
    print(f"[REPORT] HTML dashboard: {html_path}")
    for graph_path in graph_paths:
        print(f"[REPORT] Graph: {graph_path}")

    return {
        "history_csv": history_csv_path(output_dir),
        "markdown": md_path,
        "dashboard": html_path,
        "graphs": graphs_dir(output_dir),
    }


def save_run_manifest(
    results: list[BenchmarkResult],
    environment: EnvironmentInfo,
    config: dict[str, Any],
    output_dir: Path,
) -> Path:
    """Persist a complete JSON manifest for the benchmark session."""
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    manifest_path = output_dir / f"benchmark_session_{timestamp}.json"
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "environment": environment.to_dict(),
        "config": config,
        "results": [result.to_dict() for result in results],
    }
    manifest_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    latest = output_dir / "latest_benchmark_session.json"
    latest.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"[REPORT] Session JSON: {manifest_path}")
    return manifest_path
