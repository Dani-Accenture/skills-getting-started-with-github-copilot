import importlib
import sys

import pytest


@pytest.fixture(autouse=True)
def reload_app():
    """Reload `src.app` before each test so in-memory state is reset."""
    if "src.app" in sys.modules:
        importlib.reload(sys.modules["src.app"])
    else:
        import src.app  # pragma: no cover - ensure module is loaded
    yield


@pytest.fixture
def client():
    """Provide a TestClient for the FastAPI app."""
    from fastapi.testclient import TestClient
    from src.app import app

    return TestClient(app)
