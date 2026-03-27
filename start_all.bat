@echo off
echo Starting Mini-Istio Service Mesh...

echo Seeding Default Data...
call node seed_data.js

echo Starting Control Plane (Port 5000)...
start "Control Plane" cmd /k "cd control-plane && set PORT=5000 && npm start"

echo Starting Watcher...
start "Watcher" cmd /k "cd watcher && set MONGO_URI=mongodb+srv://control:2003@cluster0.vvuzah9.mongodb.net/minimesh?appName=Cluster0 && npm start"

echo Starting Service A (Port 3001)...
start "Service A" cmd /k "cd service-a && set PORT=3001 && set SIDECAR_URL=http://localhost:4001 && npm start"

echo Starting Sidecar A (Port 4001 -> 3001)...
start "Sidecar A" cmd /k "cd sidecar && set PORT=4001 && set APP_PORT=3001 && set SERVICE_NAME=service-a && set CONTROL_PLANE_URL=http://localhost:5000 && npm start"

echo Starting Service B (Port 3002)...
start "Service B" cmd /k "cd service-b && set PORT=3002 && npm start"

echo Starting Sidecar B (Port 4002 -> 3002)...
start "Sidecar B" cmd /k "cd sidecar && set PORT=4002 && set APP_PORT=3002 && set SERVICE_NAME=service-b && set CONTROL_PLANE_URL=http://localhost:5000 && npm start"

echo All services started! Check the Control Plane dashboard (React App coming soon).

echo Starting Frontend Dashboard (Port 5173)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo Register services via CURL or Postman for now.
