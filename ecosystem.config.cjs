module.exports = {
  apps: [{
    name: "ext---toolflowz",
    cwd: "/home/ubuntu/ext---toolflowz",
    script: "bash",
    args: ["-lc", "export PORT=3000 && flox activate -- bash -lc 'pnpm dev -- --port 3000 --host'"],
    env: {
      PORT: 3000
    },
    autorestart: true,
    watch: false
  }]
};
