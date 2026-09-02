#!/bin/bash

# SkyGuard Local Startup Script

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "========================================="
echo "🛡️  Starting SkyGuard AI System Services"
echo "========================================="

# 1. Start / Verify Mosquitto MQTT Broker
if ! pgrep -x "mosquitto" > /dev/null; then
    echo "▶ Starting Mosquitto MQTT Broker..."
    brew services start mosquitto || mosquitto -d
else
    echo "✓ Mosquitto MQTT Broker is already running"
fi

# 2. Start / Verify MongoDB
if ! pgrep -x "mongod" > /dev/null; then
    echo "▶ Starting MongoDB..."
    brew services start mongodb-community@7.0 2>/dev/null || brew services start mongodb-community 2>/dev/null || mongod --fork --logpath /tmp/mongod.log --dbpath /opt/homebrew/var/mongodb
else
    echo "✓ MongoDB is already running"
fi

# Kill any existing stray instances of the app services to avoid port collisions
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "node src/server.js" 2>/dev/null || true
pkill -f "node index.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# 3. Start ML Service (Port 8000)
echo "▶ Starting ML Service (FastAPI + XGBoost + Isolation Forest + SHAP)..."
cd "$PROJECT_ROOT/ml-service"
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$PROJECT_ROOT/ml-service.log" 2>&1 &
ML_PID=$!
echo "✓ ML Service started (PID: $ML_PID)"

# 4. Start Backend Gateway & WebSocket (Port 3000)
echo "▶ Starting Backend API Gateway & WebSocket..."
cd "$PROJECT_ROOT/backend_node-server"
nohup node src/server.js > "$PROJECT_ROOT/backend.log" 2>&1 &
BACKEND_PID=$!
echo "✓ Backend Gateway started (PID: $BACKEND_PID)"

# 5. Start Telemetry Simulator & Anomaly Injector (Port 3001)
echo "▶ Starting Telemetry Simulator..."
cd "$PROJECT_ROOT/simulator"
nohup node index.js > "$PROJECT_ROOT/simulator.log" 2>&1 &
SIM_PID=$!
echo "✓ Simulator started (PID: $SIM_PID)"

# 6. Start Frontend React Web App (Port 5173)
echo "▶ Starting Frontend React App (Vite)..."
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    echo "  Installing frontend dependencies..."
    npm install --silent
fi
nohup npm run dev -- --host 0.0.0.0 --port 5173 > "$PROJECT_ROOT/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "✓ Frontend started (PID: $FRONTEND_PID)"

cd "$PROJECT_ROOT"
sleep 2

echo "========================================="
echo "✅ SkyGuard Services are now LIVE!"
echo "========================================="
echo "📊 Frontend Dashboard: http://localhost:5173"
echo "🔌 Backend API:        http://localhost:3000"
echo "🧠 ML Service Docs:    http://localhost:8000/docs"
echo "🌦️ Simulator Control:  http://localhost:3001/status"
echo "========================================="
