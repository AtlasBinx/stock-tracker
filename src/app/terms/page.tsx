export default function TermsPage() {
  const siteUrl = "https://guitarstockalert.com";
  const contactEmail = "alerts@meridianrev.com";

  return (
    <div className="min-h-screen px-4 py-16" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto max-w-2xl space-y-8 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        <div>
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
          <p className="mt-2">Guitars Garden Stock Alerts · Last updated: July 2026</p>
          <p className="mt-1">Brand: Guitars Garden Stock Alerts · Contact: <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a></p>
        </div>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">1. The service</h2>
          <p>Guitars Garden Stock Alerts is a paid notification service that sends email and SMS alerts when new or restocked guitar inventory appears at Guitars Garden. We monitor the store and notify subscribers directly — we are not affiliated with Guitars Garden, do not sell guitars, and cannot guarantee inventory availability or pricing.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">2. Subscription plans</h2>
          <p>We offer three plans:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li><strong className="text-white">30-Day Pass ($9.99)</strong> — a single one-time charge covering 30 days of access. Never auto-renews. No further charge occurs after the 30-day period ends.</li>
            <li><strong className="text-white">Monthly ($7.99/mo)</strong> — billed monthly, auto-renews until cancelled. Cancel anytime; access continues through your current paid period.</li>
            <li><strong className="text-white">Annual Pass ($79.99)</strong> — a single one-time charge covering 12 months of access. Equivalent to $6.67/mo — saving $15.89 vs the monthly plan. Never auto-renews. No further charge occurs after the 12-month period ends.</li>
          </ul>
          <p className="mt-3">Prices are in USD. You will be shown the exact charge and billing terms before entering any payment information, and must actively agree before being charged.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">3. Billing and price lock</h2>
          <p>Payment is processed securely by Stripe. We never see or store your card details. If you are on the Monthly plan, your original signup price is locked in for as long as you remain subscribed — price increases for new subscribers do not affect your rate.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">4. Cancellation</h2>
          <p>You can cancel or manage your subscription at any time through the self-service account portal at <a href="/account" className="text-indigo-400 hover:underline">{siteUrl}/account</a> — no email, phone call, or support ticket required.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong className="text-white">Monthly plan:</strong> cancellation takes effect at the end of your current billing period. You keep access through the period you already paid for.</li>
            <li><strong className="text-white">30-Day Pass and Annual Pass:</strong> there is no future charge to cancel. If you want to opt out of alerts and communications before your access period ends, contact us at <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a> and we will deactivate your account immediately.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">5. Refunds</h2>
          <p>We do not offer refunds for partial periods. If you believe you were charged in error, contact us at <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a> and we will review your case promptly.</p>
        </section>

        <section style={{ border: "1px solid rgba(99,102,241,0.4)", borderRadius: "12px", padding: "20px", backgroundColor: "rgba(99,102,241,0.05)" }}>
          <h2 className="mb-3 text-base font-semibold text-white">6. SMS messaging terms and consent</h2>

          <p className="mb-3"><strong className="text-white">Program description:</strong> By subscribing to Guitars Garden Stock Alerts and checking the SMS consent checkbox at signup, you expressly consent to receive automated text messages from Guitars Garden Stock Alerts (sent via short code or 10-digit long code) about new or restocked inventory at Guitars Garden. These are transactional/service alert messages only — not marketing messages.</p>

          <p className="mb-3"><strong className="text-white">Consent is direct, voluntary, and never required:</strong> SMS consent is obtained directly from you at the point of signup on our website via an unchecked optional checkbox labeled "Yes, I want SMS alerts." You are not required to provide a phone number or check the SMS consent box to complete your purchase or use this service. Subscribers who do not opt in receive email alerts only. Consent is never obtained through a third party, affiliate, or any party other than Guitar Stock Alert.</p>

          <p className="mb-3"><strong className="text-white">Message frequency:</strong> Message frequency varies based on store activity — typically a few times per month. You will only receive a message when new or restocked inventory is detected.</p>

          <p className="mb-3"><strong className="text-white">Message and data rates:</strong> Standard message and data rates from your mobile carrier may apply.</p>

          <p className="mb-3"><strong className="text-white">How to opt out:</strong> Reply <strong className="text-white">STOP</strong> to any message at any time to immediately opt out of SMS alerts. You will receive one final confirmation message and no further SMS messages will be sent to your number. Opting out of SMS does not cancel your subscription — you will continue to receive email alerts and retain access through your paid period.</p>

          <p className="mb-3"><strong className="text-white">How to get help:</strong> Reply <strong className="text-white">HELP</strong> to any message for assistance, or contact us at <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a>.</p>

          <p><strong className="text-white">Data protection:</strong> Your phone number and SMS consent are used solely to deliver stock alerts to you. Your mobile information is never sold, rented, shared, or transferred to any third party for marketing or promotional purposes. Referral or discount code partners never receive your phone number, SMS consent status, or any personal data. See our <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a> for full details.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">7. Discount / referral codes</h2>
          <p>We offer optional discount codes that subscribers may enter at checkout for a reduced price. These codes are provided for the benefit of the subscriber only. Discount code partners (such as content creators who share a code with their audience) do not receive any subscriber data, phone numbers, email addresses, or personal information of any kind. We do not engage in third-party SMS marketing, lead generation, or affiliate SMS campaigns. All SMS messages are sent solely by Guitars Garden Stock Alerts to subscribers who have directly and individually opted in on our signup page.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">8. No guarantee of alerts</h2>
          <p>We make reasonable efforts to detect inventory changes promptly, but we cannot guarantee that every stock event will be detected or that alerts will be delivered without delay. Factors outside our control — including store downtime, Shopify API limits, email/SMS delivery failures, and carrier filtering — may affect delivery. The service is provided as-is.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">9. Acceptable use</h2>
          <p>This service is for personal use only. You may not resell, redistribute, or share your account access. We reserve the right to terminate accounts that abuse the service.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">10. Changes to these terms</h2>
          <p>We may update these terms from time to time. Material changes will be communicated by email. Continued use of the service after changes take effect constitutes acceptance of the updated terms.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">11. Contact</h2>
          <p>Questions? Email us at <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a>.</p>
        </section>
      </div>
    </div>
  );
}
