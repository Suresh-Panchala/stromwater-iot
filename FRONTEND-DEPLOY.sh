#!/bin/bash
# Frontend deployment script
# Run this AFTER backend deployment is complete

set -e
VPS_IP="43.205.194.142"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   StromWater Frontend Deployment                      ║"
echo "╚════════════════════════════════════════════════════════╝"

cd /var/www/stromwater
mkdir -p frontend
cd frontend

# Create a simple static frontend
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StromWater IoT Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div id="app" class="min-h-screen">
        <!-- Login Page -->
        <div id="loginPage" class="flex items-center justify-center min-h-screen">
            <div class="bg-white p-8 rounded-lg shadow-lg w-96">
                <h1 class="text-2xl font-bold mb-6 text-center">StromWater IoT</h1>
                <form id="loginForm">
                    <input type="text" id="username" placeholder="Username" class="w-full p-2 border rounded mb-4" value="admin">
                    <input type="password" id="password" placeholder="Password" class="w-full p-2 border rounded mb-4" value="admin123">
                    <button type="submit" class="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Login</button>
                </form>
                <div id="loginError" class="text-red-500 mt-4 hidden"></div>
            </div>
        </div>

        <!-- Dashboard Page -->
        <div id="dashboardPage" class="hidden p-6">
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold">StromWater IoT Dashboard</h1>
                    <button id="logoutBtn" class="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-xl font-bold mb-4">Device Selection</h2>
                    <select id="deviceSelect" class="w-full p-2 border rounded">
                        <option>Loading devices...</option>
                    </select>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-xl font-bold mb-4">System Status</h2>
                    <div id="systemStatus">Checking...</div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-bold mb-4">Latest Data</h2>
                <div id="dataDisplay" class="overflow-x-auto">
                    <p class="text-gray-500">Select a device to view data</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        const API_URL = 'http://' + window.location.host + '/api';
        let token = localStorage.getItem('token');

        // Login
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch(API_URL + '/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();
                if (data.token) {
                    token = data.token;
                    localStorage.setItem('token', token);
                    showDashboard();
                } else {
                    document.getElementById('loginError').textContent = 'Login failed';
                    document.getElementById('loginError').classList.remove('hidden');
                }
            } catch (err) {
                document.getElementById('loginError').textContent = 'Error: ' + err.message;
                document.getElementById('loginError').classList.remove('hidden');
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('token');
            token = null;
            showLogin();
        });

        // Show pages
        function showLogin() {
            document.getElementById('loginPage').classList.remove('hidden');
            document.getElementById('dashboardPage').classList.add('hidden');
        }

        function showDashboard() {
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('dashboardPage').classList.remove('hidden');
            loadDevices();
            checkHealth();
        }

        // Load devices
        async function loadDevices() {
            try {
                const res = await fetch(API_URL + '/devices', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const devices = await res.json();

                const select = document.getElementById('deviceSelect');
                select.innerHTML = devices.map(d =>
                    `<option value="${d.device_id}">${d.name} (${d.location})</option>`
                ).join('');

                select.addEventListener('change', () => loadData(select.value));
                if (devices.length > 0) loadData(devices[0].device_id);
            } catch (err) {
                console.error('Error loading devices:', err);
            }
        }

        // Load data
        async function loadData(deviceId) {
            try {
                const res = await fetch(API_URL + `/devices/${deviceId}/data`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await res.json();

                if (data.length > 0) {
                    const latest = data[0];
                    document.getElementById('dataDisplay').innerHTML = `
                        <table class="w-full text-left">
                            <tr><th class="p-2">Parameter</th><th class="p-2">Value</th></tr>
                            <tr><td class="p-2">Water Level</td><td class="p-2">${latest.hydrostatic_value} m</td></tr>
                            <tr><td class="p-2">Voltage R-Y-B</td><td class="p-2">${latest.vrms_1_r}V - ${latest.vrms_1_y}V - ${latest.vrms_1_b}V</td></tr>
                            <tr><td class="p-2">Current R-Y-B</td><td class="p-2">${latest.irms_1_r}A - ${latest.irms_1_y}A - ${latest.irms_1_b}A</td></tr>
                            <tr><td class="p-2">Pump 1 Status</td><td class="p-2">${latest.pump_1_status}</td></tr>
                            <tr><td class="p-2">Pump 2 Status</td><td class="p-2">${latest.pump_2_status}</td></tr>
                            <tr><td class="p-2">Temperature</td><td class="p-2">${latest.temperature}°C</td></tr>
                            <tr><td class="p-2">Timestamp</td><td class="p-2">${new Date(latest.timestamp).toLocaleString()}</td></tr>
                        </table>
                    `;
                } else {
                    document.getElementById('dataDisplay').innerHTML = '<p>No data available. Start the MQTT simulator.</p>';
                }

                setTimeout(() => loadData(deviceId), 5000); // Refresh every 5 seconds
            } catch (err) {
                console.error('Error loading data:', err);
            }
        }

        // Check health
        async function checkHealth() {
            try {
                const res = await fetch(API_URL.replace('/api', '') + '/health');
                const health = await res.json();
                document.getElementById('systemStatus').innerHTML = `
                    <p><strong>Status:</strong> ${health.status}</p>
                    <p><strong>MQTT:</strong> ${health.mqtt.connected ? '✓ Connected' : '✗ Disconnected'}</p>
                    <p><strong>Time:</strong> ${new Date(health.timestamp).toLocaleString()}</p>
                `;
                setTimeout(checkHealth, 10000); // Check every 10 seconds
            } catch (err) {
                console.error('Error checking health:', err);
            }
        }

        // Initialize
        if (token) {
            showDashboard();
        } else {
            showLogin();
        }
    </script>
</body>
</html>
EOF

# Start frontend server
npm install -g serve
pm2 delete stromwater-frontend 2>/dev/null || true
pm2 start "serve -s . -l 3000" --name stromwater-frontend
pm2 save

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   ✓ FRONTEND DEPLOYMENT COMPLETE!                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Your dashboard is ready at: http://${VPS_IP}"
echo ""
echo "Login credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "PM2 Status:"
pm2 status
