#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "========================================================"
echo "      Sobha Restaurant Demo - Local Server Launcher"
echo "========================================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js nahi mila!"
  echo "Kripya pehle Node.js (LTS version) download karein: https://nodejs.org/"
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[INFO] pnpm install ho raha hai..."
  npm install --global pnpm
fi

if [ ! -d "node_modules" ]; then
  echo "[INFO] Dependencies install ho rahi hain..."
  pnpm install
fi

echo ""
echo "========================================================"
echo "Website ready hai!"
echo "[1] Consumer / Customer Website : http://localhost:3000/"
echo "[2] Admin / Staff Dashboard    : http://localhost:3000/staff"
echo ""
echo "Staff Admin Password : AdminSobha2026!"
echo "Food Order Demo Code : SobhaDemo2026!"
echo "========================================================"
echo ""

pnpm dev
