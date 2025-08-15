export interface SlackMessage {
  text: string;
  channel: string;
}

export interface PendingOrderAlert {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  daysPending: number;
}

export class SlackIntegration {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async sendMessage(message: SlackMessage): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message.text,
          channel: message.channel,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to send Slack message:", error);
      return false;
    }
  }

  async sendPendingOrderAlert(alerts: PendingOrderAlert[]): Promise<boolean> {
    if (alerts.length === 0) {
      return true;
    }

    const alertText = alerts
      .map(
        (alert) =>
          `🚨 Order #${alert.orderNumber} has been pending for ${alert.daysPending} days\n` +
          `Customer: ${alert.customerName}\n` +
          `Phone: ${alert.customerPhone || "N/A"}`,
      )
      .join("\n\n");

    const message: SlackMessage = {
      text: `*Pending Orders Alert*\n\n${alertText}`,
      channel: "#order-alerts",
    };

    return this.sendMessage(message);
  }
}
