module.exports = {
  apps: [
    {
      name: "ltc-insurance-portal",
      script: "dist/index.js",
      cwd: "/var/www/ltc-insurance-portal/current",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      error_file: "/var/log/ltc-insurance-portal/error.log",
      out_file: "/var/log/ltc-insurance-portal/out.log",
      log_file: "/var/log/ltc-insurance-portal/combined.log",
      time: true,
      max_memory_restart: "512M",
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,
    },
  ],
};
