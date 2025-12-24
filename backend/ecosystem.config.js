/**
 * PM2 Ecosystem Configuration
 * Handles clustering and process management for NestJS backend
 */
module.exports = {
  apps: [
    {
      // Application name shown in PM2 dashboard
      name: 'cms-backend',

      // Entry point (compiled JS)
      script: 'dist/src/main.js',

      // Cluster mode settings
      instances: process.env.PM2_INSTANCES || 'max', // 'max' uses all CPU cores
      exec_mode: 'cluster',

      // Auto-restart settings
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5000,
      },

      // Logging configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      merge_logs: true,
      time: true,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // Restart strategies
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 1000,

      // Resource monitoring
      instance_var: 'INSTANCE_ID',

      // Cron restart (optional - restart at 3 AM daily)
      // cron_restart: '0 3 * * *',

      // Source maps for debugging
      source_map_support: true,

      // Node.js arguments
      node_args: [
        '--max-old-space-size=1024',
        '--optimize-for-size',
      ],
    },
  ],
};
