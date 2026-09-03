module.exports = {
  apps: [
    {
      name: "anemi-backend",
      cwd: "/var/www/anemi/backend",
      script: "dist/main.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "4100"
      }
    },
    {
      name: "anemi-frontend",
      cwd: "/var/www/anemi/frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3100 --hostname 127.0.0.1",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3100"
      }
    }
  ]
};
