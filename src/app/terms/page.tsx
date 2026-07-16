export default function TermsPage() {
  const siteUrl = "https://stock-tracker-seven-delta.vercel.app";
  const contactEmail = "alerts@meridianrev.com";

  return (
    <div className="min-h-screen px-4 py-16" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto max-w-2xl space-y-8 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        <div>
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
          <p className="mt-2">Guitars Garden Stock Alerts · Last updated: July 2026</p>
        </div>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">1. The service</h2>
          <p>Guitars Garden Stock Alerts is a paid notification service that sends email and SMS alerts when new or restocked guitar inventory appears at Guitars Garden. We monitor the store and notify you — we are not affiliated with Guitars Garden, do not sell guitars, and cannot guarantee inventory availability or pricing.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">2. Subscription plans</h2>
          <p>We offer three plans:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li><strong className="text-white">Monthly ($4.99/mo)</strong> — billed monthly, auto-renews until cancelled. Cancel anytime; access continues through your current paid period.</li>
            <li><strong className="text-white">3-Month Pass ($13.99)</strong> — a single one-time charge covering 3 months of access. Never auto-renews. No further charge occurs after the 3-month period ends.</li>
            <li><strong className="text-white">Annual Pass ($49.99)</strong> — a single one-time charge covering 12 months of access. Never auto-renews. No further charge occurs after the 12-month period ends.</li>
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
            <li><strong className="text-white">3-Month and Annual passes:</strong> there is no future charge to cancel. If you want to opt out of alerts and communications before your access period ends, contact us at <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a> and we will deactivate your account immediately.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">5. Refunds</h2>
          <p>We do not offer refunds for partial periods. If you believe you were charged in error, contact us at <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a> and we will review your case promptly.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">6. SMS alerts</h2>
          <p>By subscribing and providing your phone number, you consent to receive automated SMS stock alert messages. Message frequency varies based on store activity. Message and data rates may apply. Reply <strong className="text-white">STOP</strong> at any time to opt out of texts. Opting out of SMS does not cancel your subscription. See our <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a> for full details on how your phone number is used.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">7. No guarantee of alerts</h2>
          <p>We make reasonable efforts to detect inventory changes promptly, but we cannot guarantee that every stock event will be detected or that alerts will be delivered without delay. Factors outside our control — including store downtime, Shopify API limits, email/SMS delivery failures, and carrier filtering — may affect delivery. The service is provided as-is.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">8. Acceptable use</h2>
          <p>This service is for personal use only. You may not resell, redistribute, or share your account access. We reserve the right to terminate accounts that abuse the service.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">9. Changes to these terms</h2>
          <p>We may update these terms from time to time. Material changes will be communicated by email. Continued use of the service after changes take effect constitutes acceptance of the updated terms.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">10. Contact</h2>
          <p>Questions? Email us at <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a>.</p>
        </section>
      </div>
    </div>
  );
}
