export default function PrivacyPage() {
  const contactEmail = "alerts@meridianrev.com";

  return (
    <div className="min-h-screen px-4 py-16" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto max-w-2xl space-y-8 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        <div>
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="mt-2">Guitars Garden Stock Alerts · Last updated: July 2026</p>
          <p className="mt-1">Contact: <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a></p>
        </div>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">1. What we collect</h2>
          <p>When you subscribe, we collect:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your name and email address</li>
            <li>Your phone number (if you choose to receive SMS alerts)</li>
            <li>Your SMS consent status and the date consent was given</li>
            <li>Your subscription plan, billing status, and Stripe customer ID</li>
            <li>Any optional discount code used at signup</li>
          </ul>
          <p className="mt-3">We do not collect payment card numbers. All payment processing is handled directly by Stripe under their own privacy and security standards.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">2. How we use your information</h2>
          <p>We use your information solely to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Send you stock alert notifications by email and/or SMS</li>
            <li>Manage your subscription and billing</li>
            <li>Respond to support inquiries</li>
            <li>Operate and improve the service</li>
          </ul>
          <p className="mt-3">We do not use your data for advertising, retargeting, lead generation, or any purpose beyond operating the stock alert service you signed up for.</p>
        </section>

        <section style={{ border: "1px solid rgba(99,102,241,0.4)", borderRadius: "12px", padding: "20px", backgroundColor: "rgba(99,102,241,0.05)" }}>
          <h2 className="mb-3 text-base font-semibold text-white">3. SMS messaging — data protection</h2>

          <p className="mb-3"><strong className="text-white">No sharing of mobile information:</strong> Mobile information — including your phone number, SMS consent status, and any related data — is never sold, rented, shared, or otherwise transferred to any third party or affiliate for marketing or promotional purposes. This applies without exception.</p>

          <p className="mb-3"><strong className="text-white">Direct consent only — never required:</strong> SMS consent is collected directly from you on our signup page via an optional, unchecked checkbox. Providing your phone number and opting into SMS is entirely voluntary. You can complete your purchase and use the full service without providing a phone number or SMS consent — email alerts are always included. We never acquire SMS opt-in lists from third parties. We never send SMS messages on behalf of other businesses. We never allow third parties to send SMS messages to our subscribers.</p>

          <p className="mb-3"><strong className="text-white">SMS use is limited to stock alerts:</strong> Your phone number is used exclusively to send you automated stock alert notifications from Guitars Garden Stock Alerts. We do not send promotional campaigns, third-party offers, or marketing messages via SMS.</p>

          <p className="mb-3"><strong className="text-white">Opt out at any time:</strong> Reply <strong className="text-white">STOP</strong> to any message to permanently opt out of SMS alerts. Reply <strong className="text-white">HELP</strong> for assistance. Opting out of SMS does not affect your subscription.</p>

          <p><strong className="text-white">Carriers:</strong> Wireless carriers are not liable for undelivered or delayed messages.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">4. Discount / referral codes — no data sharing</h2>
          <p>We offer optional discount codes at signup. When a subscriber enters a discount code, we track internally that the code was used in order to honor the discount. <strong className="text-white">Discount code partners (such as content creators or referral partners who share a code with their audience) receive no subscriber data of any kind.</strong> They never receive your name, email address, phone number, SMS consent status, or any other personal information. No subscriber contact data is shared with or accessible to referral or discount code partners.</p>
          <p className="mt-3">This is not an affiliate marketing program involving any data exchange. All SMS messages originate solely from Guitars Garden Stock Alerts and are delivered only to subscribers who have personally opted in on our website.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">5. Data sharing</h2>
          <p>We do not sell, rent, or trade your personal information. We share your data only with the following service providers, and only to the extent necessary to deliver the service:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong className="text-white">Stripe</strong> — payment processing</li>
            <li><strong className="text-white">Resend</strong> — transactional email delivery</li>
            <li><strong className="text-white">Twilio</strong> — SMS delivery</li>
            <li><strong className="text-white">Turso / libSQL</strong> — database hosting</li>
            <li><strong className="text-white">Vercel</strong> — web hosting</li>
          </ul>
          <p className="mt-3">Each provider is bound by their own privacy and data protection standards. We do not share your data with any other parties.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">6. Data retention</h2>
          <p>We retain your data for as long as your subscription is active and for a reasonable period afterward in case of billing disputes or reactivation requests. You may request deletion of your account and data at any time by emailing <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a>.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">7. Security</h2>
          <p>We use industry-standard practices to protect your data, including HTTPS for all data transmission and access controls on our database. No system is perfectly secure, and we cannot guarantee absolute security, but we take reasonable precautions to protect your information.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">8. Changes to this policy</h2>
          <p>We may update this policy from time to time. Material changes will be communicated by email. Continued use of the service after changes take effect constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">9. Contact</h2>
          <p>Questions about your privacy or data? Email us at <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a>.</p>
        </section>
      </div>
    </div>
  );
}
