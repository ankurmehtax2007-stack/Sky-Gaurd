#!/bin/bash

# SkyGuard Stop Script

echo "========================================="
echo "🛑 Stopping SkyGuard Application Services"
echo "========================================="

pkill -f "uvicorn app.main:app" 2>/dev/null && echo "✓ ML Service stopped"
pkill -f "node src/server.js" 2>/dev/null && echo "✓ Backend Gateway stopped"
pkill -f "node index.js" 2>/dev/null && echo "✓ Simulator stopped"
pkill -f "vite" 2>/dev/null && echo "✓ Frontend stopped"

echo "========================================="
echo "All SkyGuard application services stopped."
echo "Note: Mosquitto & MongoDB remain managed via Homebrew."
echo "========================================="
