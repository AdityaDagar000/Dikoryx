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
```

## CLI options

| Flag | Default | Description |
|------|---------|-------------|
| `--agents` | 50 | Number of simulated endpoint agents |
| `--suite` | off | Run all preset agent counts |
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
| `metrics.py` | Response-time and system resource collection |
| `benchmark.py` | Console summary plus JSON/Markdown export |

## Output

Each run writes:

- `tests/performance/results/<run_id>_<agents>agents.json`
- `tests/performance/results/<run_id>_<agents>agents.md`

Console summary includes requests/sec, success/failure counts, average/P95/P99 latency, total runtime, and system metrics (CPU, memory, threads, connections).

## CI/CD reuse

Import and run programmatically:

```python
from pathlib import Path
from tests.performance.load_test import LoadTestConfig, LoadTestRunner

config = LoadTestConfig(agent_count=100, duration_sec=30, output_dir=Path("artifacts/perf"))
result = LoadTestRunner(config).run()
assert result.failed_requests == 0
```

## Unit tests

```bash
pytest tests/performance/test_framework.py -v
```
