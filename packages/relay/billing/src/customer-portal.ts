/**
 * Stripe Customer Portal & Self-Service Invoicing
 *
 * Implements secure customer billing portal sessions via HMAC-SHA256 signed URLs,
 * allowing team owners to update payment methods, download PDF invoices, and adjust seat counts.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-billing/customer-portal.
 */

import { createHmac } from "node:crypto";

export interface CustomerPortalSessionOptions {
  customerId: string;
  returnUrl: string;
  configurationId?: string;
  allowSeatAdjustments?: boolean;
  allowPaymentMethodUpdates?: boolean;
  allowInvoiceHistory?: boolean;
}

export interface CustomerPortalSession {
  id: string;
  url: string;
  customerId: string;
  createdAt: number;
  expiresAt: number;
}

export interface CustomerInvoice {
  id: string;
  customerId: string;
  number: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: "paid" | "open" | "void" | "uncollectible";
  hostedInvoiceUrl: string;
  pdfUrl: string;
  createdAt: number;
}

export class StripeCustomerPortalManager {
  private secretKey: string;
  private invoices = new Map<string, CustomerInvoice[]>();

  constructor(secretKey = "sk_test_relay_mock_portal_key") {
    this.secretKey = secretKey;
  }

  public generateSignedPortalUrl(
    customerId: string,
    returnUrl: string,
    expiresInSeconds = 900,
  ): string {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${customerId}:${returnUrl}:${expiresAt}`;
    const signature = createHmac("sha256", this.secretKey)
      .update(payload)
      .digest("hex");

    const encodedReturn = encodeURIComponent(returnUrl);
    return `https://billing.stripe.com/p/session/portal_${customerId}?return_url=${encodedReturn}&exp=${expiresAt}&sig=${signature}`;
  }

  public verifySignedPortalUrl(signedUrlStr: string): {
    valid: boolean;
    customerId?: string;
    reason?: string;
  } {
    try {
      const url = new URL(signedUrlStr);
      const pathname = url.pathname;
      const customerIdMatch = pathname.match(/portal_(cus_[a-zA-Z0-9]+)/);
      if (!customerIdMatch) {
        return { valid: false, reason: "Malformed portal URL path" };
      }
      const customerId = customerIdMatch[1];
      const returnUrl = url.searchParams.get("return_url");
      const expStr = url.searchParams.get("exp");
      const sig = url.searchParams.get("sig");

      if (!customerId || !returnUrl || !expStr || !sig) {
        return {
          valid: false,
          reason: "Missing required signature parameters",
        };
      }

      const exp = Number.parseInt(expStr, 10);
      if (Math.floor(Date.now() / 1000) > exp) {
        return { valid: false, reason: "Portal URL has expired" };
      }

      const expectedPayload = `${customerId}:${returnUrl}:${exp}`;
      const expectedSig = createHmac("sha256", this.secretKey)
        .update(expectedPayload)
        .digest("hex");

      if (sig !== expectedSig) {
        return { valid: false, reason: "Invalid HMAC signature" };
      }

      return { valid: true, customerId };
    } catch (err) {
      return {
        valid: false,
        reason: err instanceof Error ? err.message : String(err),
      };
    }
  }

  public async createPortalSession(
    options: CustomerPortalSessionOptions,
  ): Promise<CustomerPortalSession> {
    const now = Date.now();
    const sessionId = `bps_${Math.random().toString(36).substring(2, 12)}`;
    const url = this.generateSignedPortalUrl(
      options.customerId,
      options.returnUrl,
    );

    return {
      id: sessionId,
      url,
      customerId: options.customerId,
      createdAt: now,
      expiresAt: now + 900 * 1000,
    };
  }

  public addMockInvoice(invoice: CustomerInvoice): void {
    const list = this.invoices.get(invoice.customerId) ?? [];
    list.push(invoice);
    this.invoices.set(invoice.customerId, list);
  }

  public getInvoices(customerId: string): CustomerInvoice[] {
    return this.invoices.get(customerId) ?? [];
  }
}
