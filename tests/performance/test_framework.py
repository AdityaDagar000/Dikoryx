"""Unit tests for the Dikoryx performance testing framework."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from tests.performance.agent_simulator import SimulatedAgent, create_agents
from tests.performance.benchmark import build_benchmark_result, export_json, export_markdown
from tests.performance.metrics import MetricsCollector, _percentile
from tests.performance.load_test import DEFAULT_AGENT_COUNTS, LoadTestConfig


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
        )
        collector.stop()
        result = build_benchmark_result(
            run_id="testrun",
            agent_count=10,
            duration_sec=30.0,
            base_url="http://127.0.0.1:8000",
            metrics=collector.summarize(),
        )
        json_path = export_json(result, tmp_path / "bench.json")
        md_path = export_markdown(result, tmp_path / "bench.md")
        data = json.loads(json_path.read_text(encoding="utf-8"))
        assert data["run_id"] == "testrun"
        assert data["agent_count"] == 10
        assert "Requests/sec" in md_path.read_text(encoding="utf-8")


class TestLoadTestConfig:
    def test_default_agent_counts(self) -> None:
        assert DEFAULT_AGENT_COUNTS == (10, 50, 100, 250, 500, 1000)

    def test_config_defaults(self) -> None:
        config = LoadTestConfig()
        assert config.agent_count == 50
        assert config.base_url == "http://127.0.0.1:8000"
