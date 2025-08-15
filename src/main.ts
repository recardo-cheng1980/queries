import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { createSchema } from "./schema";
import { getPendingOrders } from "./queries/order_queries";
import { SlackNotifier, PendingOrderAlert } from "./slack";

async function main() {
  const db = await open({
    filename: "ecommerce.db",
    driver: sqlite3.Database,
  });

  await createSchema(db);

  // Check for orders pending too long and send Slack alerts
  await checkPendingOrders(db);
}

async function checkPendingOrders(db: any) {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log("SLACK_WEBHOOK_URL not set, skipping alerts");
      return;
    }

    const slackNotifier = new SlackNotifier(webhookUrl);
    const pendingOrders = await getPendingOrders(db);

    // Filter orders pending more than 3 days
    const overdue = pendingOrders.filter(
      (order) => order.days_since_created > 3,
    );

    if (overdue.length > 0) {
      const alerts: PendingOrderAlert[] = overdue.map((order) => ({
        orderNumber: `#${order.order_id}`,
        customerName: order.customer_name,
        phoneNumber: order.phone,
        daysPending: Math.floor(order.days_since_created),
      }));

      await slackNotifier.sendPendingOrderAlert(alerts);
      console.log(`Sent Slack alert for ${alerts.length} overdue orders`);
    } else {
      console.log("No overdue orders found");
    }
  } catch (error) {
    console.error("Error checking pending orders:", error);
  }
}

main();
