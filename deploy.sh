#!/bin/bash

# Kill background processes on exit
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

echo "Starting Mini-Istio Service Mesh..."

# Start Control Plane
cd control-plane
PORT=5000 npm start &
echo "Control Plane started on 5000"
cd ..

# Start Watcher
cd watcher
MONGO_URI="mongodb+srv://control:2003@cluster0.vvuzah9.mongodb.net/minimesh?appName=Cluster0" npm start &
echo "Watcher started"
cd ..

# Start Service A
cd service-a
PORT=3001 SIDECAR_URL=http://localhost:4001 npm start &
echo "Service A started on 3001"
cd ..

# Start Sidecar A
cd sidecar
PORT=4001 APP_PORT=3001 SERVICE_NAME=service-a CONTROL_PLANE_URL=http://localhost:5000 npm start &
echo "Sidecar A started on 4001"
cd ..

# Start Service B
cd service-b
PORT=3002 npm start &
echo "Service B started on 3002"
cd ..

# Start Sidecar B
cd sidecar
PORT=4002 APP_PORT=3002 SERVICE_NAME=service-b CONTROL_PLANE_URL=http://localhost:5000 npm start &
echo "Sidecar B started on 4002"
cd ..

wait
