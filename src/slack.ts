export interface SlackMessage {
  channel: string;
  text: string;
  username?: string;
  icon_emoji?: string;
}

export interface PendingOrderAlert {
  orderNumber: string;
  customerName: string;
  phoneNumber: string | null;
  daysPending: number;
}

export class SlackNotifier {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async sendMessage(message: SlackMessage): Promise<void> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Failed to send Slack message: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      throw error;
    }
  }

  async sendPendingOrderAlert(alerts: PendingOrderAlert[]): Promise<void> {
    if (alerts.length === 0) {
      return;
    }

    const alertText = alerts.map(alert => {
      const phone = alert.phoneNumber || 'No phone number';
      return `• Order ${alert.orderNumber}: ${alert.customerName} (${phone}) - ${alert.daysPending} days pending`;
    }).join('\n');

    const message: SlackMessage = {
      channel: '#order-alerts',
      text: `🚨 *Pending Orders Alert*\n\nThe following orders have been pending for more than 3 days:\n\n${alertText}`,
      username: 'Order Monitor',
      icon_emoji: ':warning:',
    };

    await this.sendMessage(message);
  }
}