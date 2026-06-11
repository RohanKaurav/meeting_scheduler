const { prisma } = require('../lib/db');

async function processReminders(){
    console.log(`[Reminder Job] Starting process at ${new Date().toISOString()}`);
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if(!webhookUrl || webhookUrl.includes('our url for webhook here')){
         console.warn('[Reminder Job] DISCORD_WEBHOOK_URL is not configured. Skipping reminders.');
         return;
    }

    try{
        const overdueItems = await prisma.actionItem.findMany({
            where:{
                status:{not:'COMPLETED'},
                dueDate: {lt: new Date()}
            },
            include:{
                reminders:true
            }
        });

        console.log(`[Reminder Job] Found ${overdueItems.length} overdue action items.`);

        for(const item of overdueItems){
            const alreadyReminded = item.reminders.some(r => r.success && r.channel === 'Discord');
            if(alreadyReminded){
                console.log(`[Reminder Job] Action Item ${item.id} was already notified. Skipping.`);
                continue;
            }
            
            console.log(`[Reminder Job] Sending reminder for action item: ${item.id} (${item.task})`);
            let success = false;
            let logMessage = '';

            try{
                const messageText = `**Reminder:** ${item.task}\n**Assigned To:** ${item.assignee}\n**Due Date:** ${item.dueDate.toISOString().split('T')[0]}`;

                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ content: messageText })
                });

                if (response.ok) {
                    success = true;
                    logMessage = 'Webhook message delivered successfully';
                } else {
                    const errText = await response.text();
                    logMessage = `Discord Webhook returned status ${response.status}: ${errText}`;
                }
            } catch(err) {
                logMessage = `Failed to send webhook request: ${err.message}`;
            }

            await prisma.reminderLog.create({
                data: {
                    actionItemId: item.id,
                    channel: 'Discord',
                    success,
                    message: logMessage
                }
            });
            console.log(`[Reminder Job] Reminder log recorded for Action Item ${item.id}. Success: ${success}`);
        }
        console.log(`[Reminder Job] Finished processing reminders.`);

    } catch(error) {
        console.error(`[Reminder Job] Error during process: ${error.message}`);
    }
}

module.exports = { processReminders };
