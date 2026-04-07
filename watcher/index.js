console.log("[WATCHER] Watcher Service is now integrated directly into the Control Plane for OFFLINE MODE.");
console.log("[WATCHER] Sidecars will be notified directly via HTTP pushing.");

// Keep process artificially alive to satisfy `concurrently` script
setInterval(() => {}, 100000);
       
