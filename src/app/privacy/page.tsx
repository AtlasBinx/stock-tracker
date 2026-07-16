export default function PrivacyPage() {
  const siteUrl = "https://stock-tracker-seven-delta.vercel.app";
  const contactEmail = "alerts@meridianrev.com";

  return (
    <div className="min-h-screen px-4 py-16" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto max-w-2xl space-y-8 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        <div>
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="mt-2">Guitars Garden Stock Alerts · Last updated: July 2026</p>
        </div>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">1. What we collect</h2>
          <p>When you subscribe, we collect your name, email address, and phone number. We also store your subscription plan, payment status (via Stripe), and whether you have consented to SMS alerts. We do not store your payment card details — those are handled entirely by Stripe.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">2. How we use your information</h2>
          <p>We use your email and phone number solely to send you stock alert notifications for Guitars Garden, and transactional messages related to your subscription (confirmations, expiry reminders, billing notices). We do not send marketing emails or promotional SMS outside of the service you signed up for.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">3. SMS messaging</h2>
          <p>By providing your phone number and checking the SMS consent box at signup, you agree to receive automated text messages from Guitars Garden Stock Alerts about new or restocked inventory. Message frequency varies based on store activity — typically a few times per month. Message and data rates may apply.</p>
          <p className="mt-3">To stop receiving SMS messages at any time, reply <strong className="text-white">STOP</strong> to any message. You will receive one confirmation text and no further messages will be sent. Opting out of SMS does not cancel your subscription.</p>
          <p className="mt-3 font-semibold text-white">Mobile information (including your phone number and SMS consent) is never shared with third parties or affiliates for marketing or promotional purposes.</p>
          <p className="mt-3">SMS opt-in data and consent records are not sold, rented, or transferred to any outside party.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">4. Sharing of information</h2>
          <p>We do not sell, rent, or share your personal information with third parties for their marketing purposes. We share data only with the following service providers, solely to operate this service:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong className="text-white">Stripe</strong> — payment processing and subscription management</li>
            <li><strong className="text-white">Twilio</strong> — SMS delivery</li>
            <li><strong className="text-white">Resend</strong> — email delivery</li>
            <li><strong className="text-white">Turso / Vercel</strong> — database and hosting infrastructure</li>
          </ul>
          <p className="mt-3">Each provider is bound by their own privacy policy and handles your data only as instructed to deliver the service.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">5. Data retention</h2>
          <p>We retain your subscriber record while your subscription is active. If you cancel and request deletion of your data, email us at <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a> and we will remove your record within 30 days.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">6. Your rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by emailing <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a>. You can manage or cancel your subscription at any time at <a href="/account" className="text-indigo-400 hover:underline">{siteUrl}/account</a>.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-white">7. Contact</h2>
          <p>Questions about this policy? Email us at <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline">{contactEmail}</a>.</p>
        </section>
      </div>
    </div>
  );
}
