"""Environment and git metadata collection for Dikoryx performance benchmarks."""

from __future__ import annotations

import os
import platform
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

try:
    import psutil
except ImportError:  # pragma: no cover
    psutil = None  # type: ignore[assignment]


@dataclass
class GitInfo:
    commit_hash: str
    branch: str
    is_dirty: bool = False


@dataclass
class EnvironmentInfo:
    python_version: str
    os_name: str
    os_release: str
    cpu_model: str
    cpu_count: int
    ram_total_gb: float
    database: str
    git_commit_hash: str
    git_branch: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _run_git(args: list[str], cwd: Path | None = None) -> str | None:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=cwd or Path.cwd(),
            capture_output=True,
            text=True,
            check=False,
            timeout=5,
        )
        if result.returncode != 0:
            return None
        return result.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return None


def collect_git_info(repo_root: Path | None = None) -> GitInfo:
    root = repo_root or Path.cwd()
    commit = _run_git(["rev-parse", "HEAD"], root) or "unknown"
    branch = _run_git(["branch", "--show-current"], root) or "unknown"
    dirty = bool(_run_git(["status", "--porcelain"], root))
    return GitInfo(commit_hash=commit, branch=branch, is_dirty=dirty)


def _sanitize_database_url(url: str) -> str:
    if not url:
        return "unknown"
    if url.startswith("sqlite"):
        return url.split("?", maxsplit=1)[0]
    try:
        parsed = urlparse(url)
        if parsed.scheme:
            host = parsed.hostname or "localhost"
            port = f":{parsed.port}" if parsed.port else ""
            db_name = parsed.path.lstrip("/") or "default"
            return f"{parsed.scheme}://{host}{port}/{db_name}"
    except ValueError:
        pass
    return url.split("@")[-1] if "@" in url else url


def _cpu_model() -> str:
    if platform.system() == "Windows":
        try:
            import winreg

            key = winreg.OpenKey(
                winreg.HKEY_LOCAL_MACHINE,
                r"HARDWARE\DESCRIPTION\System\CentralProcessor\0",
            )
            return winreg.QueryValueEx(key, "ProcessorNameString")[0].strip()
        except OSError:
            pass
    if platform.system() == "Linux":
        try:
            cpuinfo = Path("/proc/cpuinfo").read_text(encoding="utf-8", errors="ignore")
            for line in cpuinfo.splitlines():
                if line.lower().startswith("model name"):
                    return line.split(":", maxsplit=1)[1].strip()
        except OSError:
            pass
    if platform.system() == "Darwin":
        try:
            result = subprocess.run(
                ["sysctl", "-n", "machdep.cpu.brand_string"],
                capture_output=True,
                text=True,
                check=False,
                timeout=5,
            )
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
        except (OSError, subprocess.SubprocessError):
            pass
    return platform.processor() or platform.machine() or "unknown"


def collect_environment_info(
    *,
    repo_root: Path | None = None,
    database_url: str | None = None,
) -> EnvironmentInfo:
    git = collect_git_info(repo_root)
    db_url = database_url if database_url is not None else os.getenv("DATABASE_URL", "")
    cpu_count = os.cpu_count() or 1
    ram_gb = 0.0
    if psutil is not None:
        cpu_count = psutil.cpu_count(logical=True) or cpu_count
        ram_gb = round(psutil.virtual_memory().total / (1024**3), 2)

    return EnvironmentInfo(
        python_version=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        os_name=platform.system(),
        os_release=platform.release(),
        cpu_model=_cpu_model(),
        cpu_count=cpu_count,
        ram_total_gb=ram_gb,
        database=_sanitize_database_url(db_url),
        git_commit_hash=git.commit_hash,
        git_branch=git.branch,
    )
