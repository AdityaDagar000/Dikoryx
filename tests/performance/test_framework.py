"""Unit tests for the Dikoryx performance testing framework."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from unittest.mock import patch

import pytest

from tests.performance.agent_simulator import SimulatedAgent, create_agents
from tests.performance.benchmark import build_benchmark_result, export_json, export_markdown
from tests.performance.environment import EnvironmentInfo, collect_environment_info
from tests.performance.metrics import MetricsCollector, _percentile
from tests.performance.load_test import DEFAULT_AGENT_COUNTS, LoadTestConfig, config_to_report_dict
from tests.performance.reporting import (
    HISTORY_COLUMNS,
    append_to_history,
    detect_regressions,
    generate_full_report,
    generate_graphs,
    load_history,
    result_to_history_row,
)


class TestSimulatedAgent:
    def test_create_agents_have_unique_identities(self) -> None:
        agents = create_agents(5)
        assert len({agent.agent_id for agent in agents}) == 5
        assert len({agent.hostname for agent in agents}) == 5
        assert len({agent.username for agent in agents}) == 5
        assert all(agent.organization for agent in agents)

    def test_telemetry_payload_includes_required_event_types(self) -> None:
        agent = SimulatedAgent.create(index=42)
        payload = agent.telemetry_payload(min_events=20, max_events=20)
        event_types = {event["event_type"] for event in payload["events"]}
        assert "FILE_ACTIVITY_SUMMARY" in event_types or "PROCESS_ACTIVITY_SUMMARY" in event_types
        assert payload["agent_id"] == agent.agent_id

    def test_heartbeat_payload_includes_organization(self) -> None:
        agent = SimulatedAgent.create(index=7)
        payload = agent.heartbeat_payload()
        assert payload["os"]["organization_id"] == agent.organization_id
        assert payload["os"]["organization"] == agent.organization


class TestMetrics:
    def test_percentile(self) -> None:
        values = [10.0, 20.0, 30.0, 40.0, 50.0]
        assert _percentile(values, 0.95) == pytest.approx(48.0)
        assert _percentile([], 0.95) == 0.0

    def test_metrics_collector_summary(self) -> None:
        collector = MetricsCollector()
        collector.start()
        collector.record_response(
            endpoint="telemetry",
            latency_ms=100.0,
            success=True,
            status_code=200,
            events=5,
        )
        collector.record_response(
            endpoint="heartbeat",
            latency_ms=200.0,
            success=False,
            status_code=500,
            error="HTTP 500",
        )
        collector.stop()
        summary = collector.summarize()
        assert summary.total_requests == 2
        assert summary.successful_requests == 1
        assert summary.failed_requests == 1
        assert summary.total_events == 5
        assert summary.average_latency_ms == 150.0


class TestBenchmarkExport:
    def test_export_json_and_markdown(self, tmp_path: Path) -> None:
        collector = MetricsCollector()
        collector.start()
        collector.record_response(
            endpoint="telemetry",
            latency_ms=50.0,
            success=True,
            status_code=200,
            events=3,
        )
        collector.stop()
        environment = EnvironmentInfo(
            python_version="3.12.0",
            os_name="Windows",
            os_release="10",
            cpu_model="Test CPU",
            cpu_count=8,
            ram_total_gb=16.0,
            database="sqlite:///./test.db",
            git_commit_hash="abc123",
            git_branch="main",
        )
        result = build_benchmark_result(
            run_id="testrun",
            agent_count=10,
            duration_sec=30.0,
            base_url="http://127.0.0.1:8000",
            metrics=collector.summarize(),
            environment=environment,
        )
        json_path = export_json(result, tmp_path / "bench.json")
        md_path = export_markdown(result, tmp_path / "bench.md")
        data = json.loads(json_path.read_text(encoding="utf-8"))
        assert data["run_id"] == "testrun"
        assert data["agent_count"] == 10
        assert data["total_events"] == 3
        assert data["environment"]["python_version"] == "3.12.0"
        assert "Requests/sec" in md_path.read_text(encoding="utf-8")
        assert "Total events" in md_path.read_text(encoding="utf-8")


class TestLoadTestConfig:
    def test_default_agent_counts(self) -> None:
        assert DEFAULT_AGENT_COUNTS == (10, 50, 100, 250, 500, 1000)

    def test_config_defaults(self) -> None:
        config = LoadTestConfig()
        assert config.agent_count == 50
        assert config.base_url == "http://127.0.0.1:8000"
        assert config.generate_report is False

    def test_config_to_report_dict(self) -> None:
        config = LoadTestConfig(agent_count=100, duration_sec=45.0)
        report = config_to_report_dict(config)
        assert report["Duration (s)"] == 45.0
        assert "Base URL" in report


class TestEnvironment:
    def test_collect_environment_info(self) -> None:
        with patch(
            "tests.performance.environment.collect_git_info",
            return_value=type("Git", (), {"commit_hash": "deadbeef", "branch": "main", "is_dirty": False})(),
        ):
            info = collect_environment_info(database_url="sqlite:///./test.db")
        assert info.python_version
        assert info.database == "sqlite:///./test.db"
        assert info.git_commit_hash == "deadbeef"


class TestReporting:
    def _make_result(
        self,
        *,
        run_id: str,
        agent_count: int,
        latency: float,
        rps: float,
        timestamp: str,
    ):
        collector = MetricsCollector()
        collector.start()
        collector.record_response(
            endpoint="telemetry",
            latency_ms=latency,
            success=True,
            status_code=200,
            events=4,
        )
        collector.stop()
        environment = EnvironmentInfo(
            python_version="3.12.0",
            os_name="Windows",
            os_release="10",
            cpu_model="Test CPU",
            cpu_count=8,
            ram_total_gb=16.0,
            database="sqlite:///./test.db",
            git_commit_hash="abc123",
            git_branch="main",
        )
        result = build_benchmark_result(
            run_id=run_id,
            agent_count=agent_count,
            duration_sec=30.0,
            base_url="http://127.0.0.1:8000",
            metrics=collector.summarize(),
            environment=environment,
        )
        result.timestamp = timestamp
        result.requests_per_sec = rps
        result.average_latency_ms = latency
        result.p95_latency_ms = latency * 1.2
        result.system_metrics["cpu_percent_avg"] = 10.0
        result.system_metrics["memory_mb_avg"] = 100.0
        return result

    def test_history_csv_append(self, tmp_path: Path) -> None:
        result = self._make_result(
            run_id="run1",
            agent_count=10,
            latency=50.0,
            rps=20.0,
            timestamp="2026-01-01T00:00:00+00:00",
        )
        path = append_to_history(result, tmp_path)
        assert path.exists()
        rows = load_history(tmp_path)
        assert len(rows) == 1
        assert rows[0]["Agents"] == "10"
        assert list(rows[0].keys()) == list(HISTORY_COLUMNS)

    def test_detect_regressions_latency_increase(self, tmp_path: Path) -> None:
        baseline = self._make_result(
            run_id="run1",
            agent_count=50,
            latency=100.0,
            rps=50.0,
            timestamp="2026-01-01T00:00:00+00:00",
        )
        append_to_history(baseline, tmp_path)

        current = self._make_result(
            run_id="run2",
            agent_count=50,
            latency=120.0,
            rps=50.0,
            timestamp="2026-01-02T00:00:00+00:00",
        )
        warnings = detect_regressions([current], tmp_path)
        assert any(w.metric == "Average Latency" for w in warnings)

    def test_detect_regressions_throughput_decrease(self, tmp_path: Path) -> None:
        baseline = self._make_result(
            run_id="run1",
            agent_count=50,
            latency=100.0,
            rps=100.0,
            timestamp="2026-01-01T00:00:00+00:00",
        )
        append_to_history(baseline, tmp_path)

        current = self._make_result(
            run_id="run2",
            agent_count=50,
            latency=100.0,
            rps=80.0,
            timestamp="2026-01-02T00:00:00+00:00",
        )
        warnings = detect_regressions([current], tmp_path)
        assert any(w.metric == "Throughput" for w in warnings)

    def test_generate_graphs(self, tmp_path: Path) -> None:
        pytest.importorskip("matplotlib")
        results = [
            self._make_result(
                run_id=f"run{i}",
                agent_count=count,
                latency=50.0 + count,
                rps=100.0 - count,
                timestamp=f"2026-01-0{i}T00:00:00+00:00",
            )
            for i, count in enumerate((10, 50, 100), start=1)
        ]
        paths = generate_graphs(results, tmp_path)
        assert len(paths) == 5
        assert all(path.exists() for path in paths)

    def test_generate_full_report(self, tmp_path: Path) -> None:
        pytest.importorskip("matplotlib")
        results = [
            self._make_result(
                run_id="run1",
                agent_count=10,
                latency=50.0,
                rps=20.0,
                timestamp="2026-01-01T00:00:00+00:00",
            )
        ]
        environment = EnvironmentInfo(
            python_version="3.12.0",
            os_name="Windows",
            os_release="10",
            cpu_model="Test CPU",
            cpu_count=8,
            ram_total_gb=16.0,
            database="sqlite:///./test.db",
            git_commit_hash="abc123",
            git_branch="main",
        )
        artifacts = generate_full_report(results, environment, {"Duration (s)": 30}, tmp_path)
        assert artifacts["dashboard"].exists()
        assert artifacts["markdown"].exists()
        assert (tmp_path / "dashboard.html").exists()

    def test_result_to_history_row(self) -> None:
        result = self._make_result(
            run_id="run1",
            agent_count=25,
            latency=75.0,
            rps=30.0,
            timestamp="2026-01-01T00:00:00+00:00",
        )
        row = result_to_history_row(result)
        assert row["Agents"] == 25
        assert row["Average Latency"] == 75.0
