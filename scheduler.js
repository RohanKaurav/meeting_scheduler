const cron = require('node-cron');
const { processReminders } = require('./jobs/reminder');

function initScheduler() {
    console.log('[Scheduler] Initializing node-cron hourly reminder job...');

    cron.schedule('0 * * * *', async () => {
        console.log('[Scheduler] Triggering hourly overdue reminders job...');
        await processReminders();
    });

    setTimeout(async () => {
        console.log('[Scheduler] Running startup checks for overdue reminders...');
        await processReminders();
    }, 2000);
}

module.exports = { initScheduler };
