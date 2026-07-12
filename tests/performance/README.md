# Dikoryx Performance & Scalability Tests

Concurrent performance testing framework for the Dikoryx backend. Does not modify production code.

## Install

```bash
pip install -r tests/performance/requirements.txt
```

Ensure the backend is running (default `http://127.0.0.1:8000`).

## Quick start

```bash
# 50 agents for 60 seconds
python -m tests.performance.load_test --agents 50 --duration 60

# Full preset suite: 10, 50, 100, 250, 500, 1000 agents
python -m tests.performance.load_test --suite --duration 30

# Suite with full automated reporting (history, graphs, dashboard)
python -m tests.performance.load_test --suite --report
```

## CLI options

| Flag | Default | Description |
|------|---------|-------------|
| `--agents` | 50 | Number of simulated endpoint agents |
| `--suite` | off | Run all preset agent counts |
| `--report` | off | Generate graphs, suite Markdown report, HTML dashboard, and session JSON |
| `--host` | `http://127.0.0.1:8000` | Backend base URL |
| `--duration` | 60 | Test duration (seconds) |
| `--warmup` | 2 | Random per-agent startup delay (seconds) |
| `--min-interval` | 1 | Min delay between agent requests |
| `--max-interval` | 5 | Max delay between agent requests |
| `--api-key` | | Optional `Authorization: Bearer` token |
| `--output-dir` | `tests/performance/results` | Report output directory |

## Modules

| Module | Purpose |
|--------|---------|
| `agent_simulator.py` | Realistic per-agent payloads (heartbeat, file/process/clipboard/network/compliance/DLP events) |
| `load_test.py` | Concurrent load runner and CLI |
| `metrics.py` | Response-time, event count, and system resource collection |
| `benchmark.py` | Console summary plus JSON/Markdown export |
| `environment.py` | Python/OS/CPU/RAM/database/git metadata collection |
| `reporting.py` | History CSV, regression detection, matplotlib graphs, HTML dashboard |

## Automated output

Every benchmark run automatically:

- Appends a row to `tests/performance/results/history.csv`
- Writes per-run JSON and Markdown under `tests/performance/results/`
- Records environment metadata (Python, OS, CPU, RAM, database, git commit)
- Compares against the previous run at the same agent count and warns on >10% regressions (latency, CPU, memory, throughput)

With `--report`, the suite also generates:

- `tests/performance/results/graphs/` — Agents vs latency, P95, CPU, memory, throughput
- `tests/performance/results/latest_benchmark_report.md` — Suite summary
- `tests/performance/results/dashboard.html` — Interactive dashboard with history table and embedded graphs
- `tests/performance/results/latest_benchmark_session.json` — Complete session manifest

## CI/CD reuse

Import and run programmatically:

```python
from pathlib import Path
from tests.performance.load_test import LoadTestConfig, LoadTestRunner, finalize_report
from tests.performance.environment import collect_environment_info

config = LoadTestConfig(agent_count=100, duration_sec=30, output_dir=Path("artifacts/perf"), generate_report=True)
env = collect_environment_info()
result = LoadTestRunner(config, environment=env).run()
finalize_report([result], config, env)
assert result.failed_requests == 0
```

## Unit tests

```bash
pytest tests/performance/test_framework.py -v
```
