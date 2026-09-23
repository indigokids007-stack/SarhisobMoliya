// PM2 Process Manager Configuration for Sarhisob AI
module.exports = {
  apps: [
    {
      name: 'sarhisob-ai',
      script: 'node_modules/.bin/tsx',
      args: 'server.ts',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
