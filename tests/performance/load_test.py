"""Concurrent load runner for Dikoryx backend performance tests."""

from __future__ import annotations

import argparse
import random
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import requests

from tests.performance.agent_simulator import SimulatedAgent, create_agents
from tests.performance.benchmark import (
    BenchmarkResult,
    build_benchmark_result,
    export_json,
    export_markdown,
    print_console_summary,
)
from tests.performance.environment import EnvironmentInfo, collect_environment_info
from tests.performance.metrics import MetricsCollector
from tests.performance.reporting import (
    append_to_history,
    detect_regressions,
    generate_full_report,
    print_regression_warnings,
    save_run_manifest,
)

DEFAULT_AGENT_COUNTS: tuple[int, ...] = (10, 50, 100, 250, 500, 1000)
DEFAULT_BASE_URL = "http://127.0.0.1:8000"
DEFAULT_DURATION_SEC = 60.0
DEFAULT_WARMUP_SEC = 2.0
DEFAULT_MIN_INTERVAL_SEC = 1.0
DEFAULT_MAX_INTERVAL_SEC = 5.0


@dataclass
class LoadTestConfig:
    base_url: str = DEFAULT_BASE_URL
    agent_count: int = 50
    duration_sec: float = DEFAULT_DURATION_SEC
    warmup_sec: float = DEFAULT_WARMUP_SEC
    min_interval_sec: float = DEFAULT_MIN_INTERVAL_SEC
    max_interval_sec: float = DEFAULT_MAX_INTERVAL_SEC
    api_key: str = ""
    output_dir: Path = Path("tests/performance/results")
    sample_interval_sec: float = 1.0
    request_timeout_sec: float = 10.0
    generate_report: bool = False


class LoadTestRunner:
    """Runs many simulated agents concurrently against the Dikoryx backend."""

    def __init__(
        self,
        config: LoadTestConfig,
        *,
        environment: EnvironmentInfo | None = None,
    ) -> None:
        self.config = config
        self.metrics = MetricsCollector()
        self.environment = environment or collect_environment_info()

    def run(self) -> BenchmarkResult:
        agents = create_agents(self.config.agent_count)
        stop_event = threading.Event()
        run_id = uuid.uuid4().hex[:12]

        print(
            f"\n[LOAD TEST] Starting run {run_id} | agents={self.config.agent_count} "
            f"| duration={self.config.duration_sec:.0f}s | target={self.config.base_url}"
        )

        sampler = threading.Thread(
            target=self._sample_system_loop,
            args=(stop_event,),
            daemon=True,
            name="perf-system-sampler",
        )

        self.metrics.start()
        sampler.start()
        end_time = time.perf_counter() + self.config.duration_sec

        with ThreadPoolExecutor(max_workers=self.config.agent_count) as executor:
            futures = [
                executor.submit(self._agent_loop, agent, end_time, stop_event)
                for agent in agents
            ]
            for future in as_completed(futures):
                future.result()

        stop_event.set()
        sampler.join(timeout=2.0)
        self.metrics.stop()

        result = build_benchmark_result(
            run_id=run_id,
            agent_count=self.config.agent_count,
            duration_sec=self.config.duration_sec,
            base_url=self.config.base_url,
            metrics=self.metrics.summarize(),
            environment=self.environment,
        )
        self._export_result(result)
        print_console_summary(result)
        return result

    def _headers(self) -> dict[str, str]:
        if not self.config.api_key:
            return {}
        return {"Authorization": f"Bearer {self.config.api_key}"}

    def _agent_loop(
        self,
        agent: SimulatedAgent,
        end_time: float,
        stop_event: threading.Event,
    ) -> None:
        session = requests.Session()
        session.headers.update(self._headers())
        time.sleep(random.uniform(0, self.config.warmup_sec))

        while time.perf_counter() < end_time and not stop_event.is_set():
            if random.random() < 0.25:
                outcome = agent.send_heartbeat(
                    session,
                    self.config.base_url,
                    timeout=self.config.request_timeout_sec,
                )
                self._record(outcome, endpoint="heartbeat")
            else:
                outcome = agent.send_telemetry(
                    session,
                    self.config.base_url,
                    timeout=self.config.request_timeout_sec,
                )
                self._record(outcome, endpoint="telemetry")

            sleep_for = random.uniform(
                self.config.min_interval_sec,
                self.config.max_interval_sec,
            )
            if time.perf_counter() + sleep_for >= end_time:
                break
            time.sleep(sleep_for)

        session.close()

    def _record(
        self,
        outcome: tuple[bool, float, int | None, str | None, int],
        *,
        endpoint: str,
    ) -> None:
        success, latency_ms, status_code, error, events = outcome
        self.metrics.record_response(
            endpoint=endpoint,
            latency_ms=latency_ms,
            success=success,
            status_code=status_code,
            error=error,
            events=events,
        )

    def _sample_system_loop(self, stop_event: threading.Event) -> None:
        while not stop_event.is_set():
            self.metrics.sample_system()
            stop_event.wait(self.config.sample_interval_sec)

    def _export_result(self, result: BenchmarkResult) -> None:
        base = self.config.output_dir / f"{result.run_id}_{result.agent_count}agents"
        json_path = export_json(result, base.with_suffix(".json"))
        md_path = export_markdown(result, base.with_suffix(".md"))
        append_to_history(result, self.config.output_dir)
        warnings = detect_regressions([result], self.config.output_dir)
        print_regression_warnings(warnings)
        print(f"[LOAD TEST] Wrote {json_path}")
        print(f"[LOAD TEST] Wrote {md_path}")


def config_to_report_dict(config: LoadTestConfig) -> dict[str, str | float | int]:
    return {
        "Base URL": config.base_url,
        "Duration (s)": config.duration_sec,
        "Warmup (s)": config.warmup_sec,
        "Min interval (s)": config.min_interval_sec,
        "Max interval (s)": config.max_interval_sec,
        "Sample interval (s)": config.sample_interval_sec,
        "Request timeout (s)": config.request_timeout_sec,
        "Output directory": str(config.output_dir),
    }


def run_suite(
    config: LoadTestConfig,
    agent_counts: Iterable[int],
    *,
    environment: EnvironmentInfo | None = None,
) -> list[BenchmarkResult]:
    env = environment or collect_environment_info()
    results: list[BenchmarkResult] = []
    for count in agent_counts:
        run_config = LoadTestConfig(
            base_url=config.base_url,
            agent_count=count,
            duration_sec=config.duration_sec,
            warmup_sec=config.warmup_sec,
            min_interval_sec=config.min_interval_sec,
            max_interval_sec=config.max_interval_sec,
            api_key=config.api_key,
            output_dir=config.output_dir,
            sample_interval_sec=config.sample_interval_sec,
            request_timeout_sec=config.request_timeout_sec,
            generate_report=config.generate_report,
        )
        results.append(LoadTestRunner(run_config, environment=env).run())

    if config.generate_report:
        finalize_report(results, run_config, env)

    return results


def finalize_report(
    results: list[BenchmarkResult],
    config: LoadTestConfig,
    environment: EnvironmentInfo | None = None,
) -> None:
    env = environment or collect_environment_info()
    report_config = config_to_report_dict(config)
    if len(results) == 1:
        report_config["Agents"] = results[0].agent_count
    else:
        report_config["Agent counts"] = ", ".join(str(result.agent_count) for result in results)

    save_run_manifest(results, env, report_config, config.output_dir)
    generate_full_report(results, env, report_config, config.output_dir)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run concurrent Dikoryx backend performance tests.",
    )
    parser.add_argument(
        "--agents",
        type=int,
        default=50,
        help="Number of simulated endpoint agents (default: 50).",
    )
    parser.add_argument(
        "--suite",
        action="store_true",
        help=f"Run preset agent counts: {', '.join(str(n) for n in DEFAULT_AGENT_COUNTS)}.",
    )
    parser.add_argument(
        "--report",
        action="store_true",
        help="Generate history CSV, graphs, Markdown report, and HTML dashboard after the run.",
    )
    parser.add_argument(
        "--host",
        default=DEFAULT_BASE_URL,
        help=f"Backend base URL (default: {DEFAULT_BASE_URL}).",
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=DEFAULT_DURATION_SEC,
        help=f"Test duration in seconds (default: {DEFAULT_DURATION_SEC:.0f}).",
    )
    parser.add_argument(
        "--warmup",
        type=float,
        default=DEFAULT_WARMUP_SEC,
        help=f"Random warmup delay per agent in seconds (default: {DEFAULT_WARMUP_SEC:.0f}).",
    )
    parser.add_argument(
        "--min-interval",
        type=float,
        default=DEFAULT_MIN_INTERVAL_SEC,
        help="Minimum seconds between agent requests.",
    )
    parser.add_argument(
        "--max-interval",
        type=float,
        default=DEFAULT_MAX_INTERVAL_SEC,
        help="Maximum seconds between agent requests.",
    )
    parser.add_argument(
        "--api-key",
        default="",
        help="Optional agent API key for authenticated backends.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("tests/performance/results"),
        help="Directory for benchmark exports, history, graphs, and dashboard.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    config = LoadTestConfig(
        base_url=args.host,
        agent_count=args.agents,
        duration_sec=args.duration,
        warmup_sec=args.warmup,
        min_interval_sec=args.min_interval,
        max_interval_sec=args.max_interval,
        api_key=args.api_key,
        output_dir=args.output_dir,
        generate_report=args.report,
    )
    environment = collect_environment_info()

    if args.suite:
        run_suite(config, DEFAULT_AGENT_COUNTS, environment=environment)
    else:
        result = LoadTestRunner(config, environment=environment).run()
        if config.generate_report:
            finalize_report([result], config, environment)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
