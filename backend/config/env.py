"""Environment-driven configuration helpers.

Values are read from real process environment variables first, then from a
local ``.env`` file (development convenience only). Production configuration
must be provided by the hosting platform's environment.
"""
from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import parse_qsl, urlparse

BASE_DIR = Path(__file__).resolve().parent.parent


class ImproperlyConfigured(RuntimeError):
    """Raised when required configuration is missing or malformed."""


def _load_env_file() -> None:
    env_file = BASE_DIR / ".env"
    if not env_file.is_file():
        return
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_env_file()


def env(name: str, default: str | None = None) -> str:
    value = os.environ.get(name)
    if value is None or value == "":
        if default is not None:
            return default
        raise ImproperlyConfigured(f"Missing required environment variable: {name}")
    return value


def env_bool(name: str, default: str = "false") -> bool:
    return env(name, default).strip().lower() in {"1", "true", "yes", "on"}


def env_int(name: str, default: str) -> int:
    raw = env(name, default)
    try:
        return int(raw)
    except ValueError as exc:
        raise ImproperlyConfigured(f"Environment variable {name} must be an integer, got: {raw!r}") from exc


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in env(name, default).split(",") if item.strip()]


def parse_database_url(url: str, base_dir: Path) -> dict:
    """Translate a ``DATABASE_URL`` into a Django ``DATABASES`` entry.

    Supports ``sqlite:///relative/or/absolute/path`` and
    ``postgresql://user:pass@host:port/dbname?sslmode=require``.
    """
    if url.startswith("sqlite:"):
        name = url.split("///", 1)[1] if "///" in url else ""
        if not name or name == ":memory:":
            return {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}
        path = Path(name)
        absolute = path if path.is_absolute() else base_dir / path
        return {"ENGINE": "django.db.backends.sqlite3", "NAME": str(absolute)}

    parsed = urlparse(url)
    if parsed.scheme not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured(f"Unsupported DATABASE_URL scheme: {parsed.scheme!r}")

    # Every query parameter is forwarded to libpq verbatim (sslmode,
    # channel_binding, ...) — pooled Neon strings carry both, e.g.
    # postgresql://user:pass@host/db?sslmode=require&channel_binding=require
    options = dict(parse_qsl(parsed.query))
    options.setdefault("sslmode", "prefer")
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": parsed.path.lstrip("/") or "postgres",
        "USER": parsed.username or "",
        "PASSWORD": parsed.password or "",
        "HOST": parsed.hostname or "",
        "PORT": str(parsed.port or "5432"),
        "CONN_MAX_AGE": env_int("DATABASE_CONN_MAX_AGE", "60"),
        "OPTIONS": options,
    }
