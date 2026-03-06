import { Injectable, Logger } from "@nestjs/common";

interface WebhookRegistration {
  id: string;
  url: string;
  events: string[];
  secret: string;
  createdAt: Date;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private webhooks: Map<string, WebhookRegistration> = new Map();

  register(data: {
    url: string;
    events: string[];
    secret: string;
  }): WebhookRegistration {
    const id = `wh_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const webhook: WebhookRegistration = {
      id,
      url: data.url,
      events: data.events,
      secret: data.secret,
      createdAt: new Date(),
    };
    this.webhooks.set(id, webhook);
    return webhook;
  }

  findAll(): WebhookRegistration[] {
    return Array.from(this.webhooks.values());
  }

  delete(id: string): boolean {
    return this.webhooks.delete(id);
  }

  async dispatch(event: string, payload: any) {
    const matches = Array.from(this.webhooks.values()).filter(
      (wh: WebhookRegistration) =>
        wh.events.includes(event) || wh.events.includes("*"),
    );

    for (const wh of matches) {
      try {
        const body = JSON.stringify({
          event,
          payload,
          timestamp: new Date().toISOString(),
        });

        // Compute HMAC signature
        const crypto = await import("crypto");
        const signature = crypto
          .createHmac("sha256", wh.secret)
          .update(body)
          .digest("hex");

        await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-PonyLab-Signature": `sha256=${signature}`,
            "X-PonyLab-Event": event,
          },
          body,
        });
        this.logger.log(`Webhook dispatched: ${event} → ${wh.url}`);
      } catch (err: any) {
        this.logger.warn(`Webhook delivery failed: ${wh.url} — ${err.message}`);
      }
    }
  }
}
