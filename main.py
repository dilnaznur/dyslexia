"""ASGI entrypoint shim for Render deployments.

Allows `uvicorn main:app` to work when the service starts from repo root.
"""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys


BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

backend_main = BACKEND_DIR / "main.py"
spec = spec_from_file_location("mindstep_backend_main", backend_main)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load backend/main.py")

module = module_from_spec(spec)
spec.loader.exec_module(module)
app = module.app
