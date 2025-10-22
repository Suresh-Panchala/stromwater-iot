// PM2 Ecosystem Configuration for StromWater IoT Platform
// Manages both Backend API and Frontend servers

module.exports = {
  apps: [
    // Backend API Server
    {
      name: 'stromwater-backend',
      script: './src/server.js',
      cwd: '/var/www/stromwater/backend',
      instances: 1,  // Increase for load balancing (e.g., 2 for dual-core)
      exec_mode: 'fork',  // Use 'cluster' for multiple instances
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/var/log/stromwater/backend-error.log',
      out_file: '/var/log/stromwater/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      kill_timeout: 5000,
      listen_timeout: 3000,
    },

    // Frontend Server (Vite Preview)
    {
      name: 'stromwater-frontend',
      script: 'npx',
      args: 'vite preview --port 3000 --host 0.0.0.0',
      cwd: '/var/www/stromwater/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/stromwater/frontend-error.log',
      out_file: '/var/log/stromwater/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      kill_timeout: 5000,
      listen_timeout: 3000,
    }
  ],

  // Optional: Deployment configuration for automated deploys
  deploy: {
    production: {
      user: 'deploy',
      host: 'YOUR_VPS_IP',
      ref: 'origin/main',
      repo: 'YOUR_GIT_REPO_URL',
      path: '/var/www/stromwater',
      'post-deploy': 'cd backend && npm install --production && cd ../frontend && npm install && npm run build && pm2 reload ecosystem.config.js --env production',
    }
  }
};
