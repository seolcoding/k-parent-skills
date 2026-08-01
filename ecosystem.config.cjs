module.exports = {
  apps: [
    {
      name: "k-parent-proxy",
      cwd: __dirname,
      script: "./scripts/run-k-parent-proxy.sh",
      interpreter: "/bin/bash",
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
