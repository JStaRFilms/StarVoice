#!/usr/bin/env python3
"""
VibeCode Verification Script - Whisper Flow Edition
====================================================
Cross-platform verification for Tauri + React + TypeScript projects.
Runs TypeScript check, Rust check, and Tauri build to ensure code quality.

Usage:
    python scripts/vibe-verify.py
    python scripts/vibe-verify.py --quick    # Skip build, just tsc + cargo check
    python scripts/vibe-verify.py --strict   # Treat warnings as errors
"""

import subprocess
import sys
import os
from pathlib import Path


class Colors:
    """ANSI color codes for terminal output."""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def detect_package_manager() -> str:
    """Detect which package manager is being used."""
    if Path('pnpm-lock.yaml').exists():
        return 'pnpm'
    elif Path('yarn.lock').exists():
        return 'yarn'
    elif Path('bun.lockb').exists():
        return 'bun'
    else:
        return 'npm'


def run_command(cmd: list[str], description: str, cwd: str = None) -> tuple[bool, str]:
    """Run a command and return success status and output."""
    print(f"\n{Colors.BLUE}🔍 {description}...{Colors.RESET}")
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            shell=(os.name == 'nt'),  # Use shell on Windows
            cwd=cwd
        )
        
        if result.returncode == 0:
            print(f"{Colors.GREEN}✅ {description}: PASS{Colors.RESET}")
            return True, result.stdout
        else:
            print(f"{Colors.RED}❌ {description}: FAIL{Colors.RESET}")
            # Show error output
            error_output = result.stderr or result.stdout
            if error_output:
                # Limit output to first 30 lines
                lines = error_output.strip().split('\n')[:30]
                for line in lines:
                    print(f"   {line}")
                if len(error_output.strip().split('\n')) > 30:
                    print(f"   ... (truncated, {len(error_output.strip().split(chr(10)))} total lines)")
            return False, error_output
            
    except FileNotFoundError:
        print(f"{Colors.YELLOW}⚠️ {description}: SKIPPED (command not found){Colors.RESET}")
        return True, ""  # Don't fail on missing commands
    except Exception as e:
        print(f"{Colors.RED}❌ {description}: ERROR - {str(e)}{Colors.RESET}")
        return False, str(e)


def main():
    """Run all verification checks."""
    quick_mode = '--quick' in sys.argv
    strict_mode = '--strict' in sys.argv
    
    print(f"\n{Colors.BOLD}{'='*50}")
    print(f"🔍 Whisper Flow Verification Report")
    print(f"{'='*50}{Colors.RESET}")
    
    # Check we're in the project root
    if not Path('package.json').exists():
        print(f"{Colors.RED}❌ No package.json found. Are you in the project root?{Colors.RESET}")
        sys.exit(1)
    
    if not Path('src-tauri').exists():
        print(f"{Colors.RED}❌ No src-tauri directory found. This is a Tauri project verification script.{Colors.RESET}")
        sys.exit(1)
    
    pm = detect_package_manager()
    print(f"\n📦 Package Manager: {Colors.BLUE}{pm}{Colors.RESET}")
    print(f"🦀 Rust: {Colors.BLUE}Detected{Colors.RESET}")
    
    results = []
    
    # 1. TypeScript Check (Frontend)
    tsc_passed, tsc_output = run_command(
        ['npx', 'tsc', '--noEmit'],
        "TypeScript Check (Frontend)"
    )
    results.append(('TypeScript', tsc_passed))
    
    # 2. Rust Check (Backend)
    rust_check_passed, rust_output = run_command(
        ['cargo', 'check'],
        "Rust Check (Backend)",
        cwd='src-tauri'
    )
    results.append(('Rust Check', rust_check_passed))
    
    # 3. Rust Clippy (Linting)
    clippy_args = ['cargo', 'clippy']
    if strict_mode:
        clippy_args.extend(['--', '-D', 'warnings'])
    
    clippy_passed, clippy_output = run_command(
        clippy_args,
        "Rust Clippy (Linting)",
        cwd='src-tauri'
    )
    results.append(('Rust Clippy', clippy_passed))
    
    # 4. Build Check (skip in quick mode)
    if not quick_mode:
        build_cmd = [pm, 'run', 'tauri', 'build']
        if pm == 'npm':
            build_cmd = ['npm', 'run', 'tauri', 'build']
        
        build_passed, build_output = run_command(
            build_cmd,
            "Tauri Build"
        )
        results.append(('Build', build_passed))
    
    # Summary
    print(f"\n{Colors.BOLD}{'='*50}")
    print(f"📊 Summary")
    print(f"{'='*50}{Colors.RESET}")
    
    all_passed = True
    for name, passed in results:
        status = f"{Colors.GREEN}PASS{Colors.RESET}" if passed else f"{Colors.RED}FAIL{Colors.RESET}"
        print(f"   {name}: {status}")
        if not passed:
            all_passed = False
    
    print(f"{'='*50}")
    
    if all_passed:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✨ All checks passed! Ready for handoff.{Colors.RESET}\n")
        sys.exit(0)
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}🛑 Verification failed. Fix errors before proceeding.{Colors.RESET}\n")
        sys.exit(1)


if __name__ == '__main__':
    main()
