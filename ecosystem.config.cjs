module.exports = {
  apps: [
    {
      name: "bocchi",
      script: "src/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      time: true,
      max_memory_restart: "512M",
      exp_backoff_restart_delay: 200,
      kill_timeout: 10000,
      merge_logs: true,
      out_file: "./logs/bocchi-out.log",
      error_file: "./logs/bocchi-error.log",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
