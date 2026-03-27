# 🕸️ Mini-Istio Service Mesh Explorer

![Project Status](https://img.shields.io/badge/Status-Complete-success) ![Node.js](https://img.shields.io/badge/Node.js-18%2B-blue) ![React](https://img.shields.io/badge/React-18-blue)

Welcome to the **Mini-Istio Service Mesh Explorer**! This is a production-grade, highly interactive educational demo designed to visualize and teach advanced cloud-native architecture concepts. It simulates how a **Service Mesh** (like Istio) routes traffic, manages service discovery, and protects failing microservices using **Circuit Breakers**.

## ✨ Key Features
- **🚀 Interactive Topology Hub**: Visually trace requests flowing between microservices and their sidecar proxies using real-time animated glowing particles.
- **🛡️ Dynamic Circuit Breaker**: Watch the physical UI switch mechanically snap "OPEN" when a service fails, demonstrating the *Fast-Fail* protective mechanism.
- **📚 Novice Tutorial Mode**: Toggle context-aware, floating explanation cards that break down complex mesh concepts into plain English.
- **⚡ 100% Offline Reliable**: Powered by an ultra-fast in-memory Control Plane, bypassing DNS or internet issues, making it flawless for live classroom presentations.
- **🎨 Premium UI Dashboard**: Built with React, TailwindCSS, and Framer Motion for a stunning, glassmorphism-inspired aesthetic inspired by top-tier SaaS platforms.

## 🏗️ Technical Architecture
Instead of a monolithic application, this project simulates a distributed microservice environment consisting of 5 autonomous Node.js processes communicating seamlessly:

1. **Control Plane** (Port `5000`): The central brain. Maintains the Service Registry, Routing Policies, and pushes live Circuit Breaker configurations to Sidecars globally.
2. **Watcher Service**: An integrated daemon that observes configuration changes and updates the mesh proactively using direct Webhooks.
3. **Sidecar Proxies** (Ports `4001`, `4002`): The Data Plane. These micro-proxies intercept all traffic going into and out of the microservices, cleanly isolating business logic from network logic.
4. **Microservices (The App)**:
   - `Service A` (The Caller Frontend API)
   - `Service B` (The Target Data API - Simulated to fail 30% of the time to demonstrate real-world unreliability!)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm or yarn

### Installation & Execution
1. Clone the repository and install all dependencies explicitly for every microservice:
   ```bash
   git clone https://github.com/Abhaykauahal21/Istio-service.git
   cd Istio-service
   npm install
   ```

2. Start the entire mesh cluster (Frontend, Control Plane, Sidecars, and Services):
   ```bash
   npm start
   ```
   *(Windows Users: You can alternatively double-click the `start_all.bat` file).*

3. Open your browser and navigate to the live Dashboard: **http://localhost:5173**

---

## 💡 How to Demonstrate the Circuit Breaker

The primary goal of this dashboard is to showcase the **Circuit Breaker Pattern**. Follow these exact steps for a flawless live demonstration:

1. **Start the Tutorial**: Toggle "Novice Tutorial" in the top right corner to enable the floating architectural explanation guides.
2. **Configure the Breaker**: Navigate to the **Security Tab**. Change the **Failure Threshold (Strikes)** to `1`. Click **Apply & Push Config to Sidecars**. This tells the Sidecar to immediately block traffic if it detects a single failure.
3. **Trace the Network**: Navigate back to the **Topology Hub** Tab.
4. **Fire Traffic**: Repeatedly click the **Fire Traffic Trace** button at the bottom.
5. **Observe the Protective Mesh**: Because `Service B` is hardcoded to randomly crash 30% of the time, your trace will eventually hit a 500 Internal Server error. 
6. **The Result**: The Sidecar instantly detects this failure, trips the Circuit Breaker, and visually snaps the mechanical switch in the UI to **RED (OPEN)** to protect the system. After a brief cooldown period (customizable in the Security Tab), it transitions to **YELLOW (COOLDOWN)** to test network recovery, before finally resetting to **GREEN (CLOSED)**.

---
*Built with ❤️ for Cloud Architecture Education & Distributed Systems demonstrations.*
