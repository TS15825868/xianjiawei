#!/usr/bin/env python3
"""Compatibility validation entrypoint for current approved product/media roles."""
from pathlib import Path
import runpy

ROOT=Path(__file__).resolve().parents[1]
if __name__=='__main__':
    runpy.run_path(str(ROOT/'tools/validate-site-production-release-v20260809.py'),run_name='__main__')
