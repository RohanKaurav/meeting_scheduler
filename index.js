const { initScheduler } = require('./scheduler');

console.log('[App] Starting scheduler service...');
initScheduler();

// Keep the process alive
process.on('SIGTERM', () => {
    console.log('[App] Received SIGTERM, shutting down gracefully.');
    process.exit(0);
});