module.exports = {
  apps: [
    {
      name: 'arv-ai-bot',
      script: 'src/index.js',
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
