module.exports = {
  DEFAULTS: {
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || '0.0.0.0',
    mcHost: process.env.MC_HOST || 'localhost',
    mcPort: Number(process.env.MC_PORT || 25565),
    username: process.env.MC_USERNAME || 'ARVBot',
    version: process.env.MC_VERSION || '1.20.4',
    auth: process.env.MC_AUTH || 'offline',
    reconnect: process.env.MC_RECONNECT !== 'false',
    reconnectDelay: Number(process.env.MC_RECONNECT_DELAY || 5000),
    retryLimit: Number(process.env.MC_RETRY_LIMIT || 5),
    dashboardUsername: process.env.DASHBOARD_USERNAME || 'admin',
    dashboardPassword: process.env.DASHBOARD_PASSWORD || 'change-me'
  }
};
