import cron from 'node-cron';
import { env } from '../config/env.js';
import { checkLowStockAndNotify } from './inventoryService.js';

export function startCronJobs() {
  let task = null;

  if (!cron.validate(env.lowStockCron)) {
    console.error(`[cron] Invalid LOW_STOCK_CRON expression: "${env.lowStockCron}". Low stock checks disabled.`);
    return null;
  }

  task = cron.schedule(env.lowStockCron, async () => {
    try {
      const result = await checkLowStockAndNotify({ trigger: 'cron' });
      if (result.lowItems?.length) {
        console.log(
          `[cron] Low stock scan complete: ${result.lowItems.length} low item(s), email ${result.sent ? 'sent' : 'skipped'}.`
        );
      }
    } catch (error) {
      console.error('[cron] Low stock check failed:', error);
    }
  });

  console.log(`[cron] Low stock checks scheduled (${env.lowStockCron}).`);
  return task;
}
