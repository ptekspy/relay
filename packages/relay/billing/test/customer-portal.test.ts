import { describe, expect, it } from "bun:test";
import { StripeCustomerPortalManager } from "../src/customer-portal.js";

describe("TASK-194: Stripe Customer Portal & Self-Service Invoicing", () => {
  const manager = new StripeCustomerPortalManager("whsec_portal_super_secret");

  it("generates signed Stripe portal session URL and successfully verifies HMAC signature", async () => {
    const session = await manager.createPortalSession({
      customerId: "cus_alpha123",
      returnUrl: "https://relay.paddy.systems/dashboard/billing",
      allowSeatAdjustments: true,
      allowPaymentMethodUpdates: true,
    });

    expect(session.id).toStartWith("bps_");
    expect(session.url).toContain(
      "https://billing.stripe.com/p/session/portal_cus_alpha123",
    );
    expect(session.url).toContain("sig=");
    expect(session.url).toContain("exp=");

    // Verify signature
    const verification = manager.verifySignedPortalUrl(session.url);
    expect(verification.valid).toBe(true);
    expect(verification.customerId).toBe("cus_alpha123");
  });

  it("rejects tampered or forged portal URLs", () => {
    const validUrl = manager.generateSignedPortalUrl(
      "cus_legit_user",
      "https://relay.paddy.systems/settings",
    );

    // Tamper with customer ID in URL
    const tamperedUrl = validUrl.replace("cus_legit_user", "cus_attacker_user");
    const tamperedVerification = manager.verifySignedPortalUrl(tamperedUrl);

    expect(tamperedVerification.valid).toBe(false);
    expect(tamperedVerification.reason).toBe("Invalid HMAC signature");
  });

  it("provides customer self-service invoice history with PDF download endpoints", () => {
    const customerId = "cus_invoice_reader";
    manager.addMockInvoice({
      id: "in_101",
      customerId,
      number: "INV-2026-001",
      amountDue: 4500, // $45.00
      amountPaid: 4500,
      currency: "usd",
      status: "paid",
      hostedInvoiceUrl: "https://invoice.stripe.com/i/in_101",
      pdfUrl: "https://pay.stripe.com/invoice/in_101/pdf",
      createdAt: Date.now() - 86400000,
    });

    const invoices = manager.getInvoices(customerId);
    expect(invoices.length).toBe(1);
    expect(invoices[0]?.number).toBe("INV-2026-001");
    expect(invoices[0]?.status).toBe("paid");
    expect(invoices[0]?.pdfUrl).toContain("pdf");
  });
});
