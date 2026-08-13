"use client";

import { useState } from "react";

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderLeft: "4px solid #F0A500",
      borderRadius: "0 10px 10px 0",
      marginBottom: "20px",
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(14,21,32,0.08)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        gap: "12px",
      }}>
        <span style={{
          fontFamily: "'Trebuchet MS', Arial, sans-serif",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: "var(--text-muted)",
        }}>
          {label}
        </span>
        <button
          onClick={handleCopy}
          style={{
            fontFamily: "'Trebuchet MS', Arial, sans-serif",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            background: copied ? "#22c55e" : "#F0A500",
            color: copied ? "#fff" : "#0E1520",
            border: "none",
            borderRadius: "6px",
            padding: "5px 12px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre style={{
        padding: "18px 20px",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "14px",
        lineHeight: 1.75,
        color: "var(--text)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        margin: 0,
      }}>
        {text}
      </pre>
    </div>
  );
}

function Section({ title, tag }: { title: string; tag: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "56px 0 24px" }}>
      <span style={{
        fontFamily: "'Trebuchet MS', Arial, sans-serif",
        fontSize: "22px",
        fontWeight: 800,
        letterSpacing: "-0.02em",
      }}>
        {title}
      </span>
      <span style={{
        fontFamily: "'Trebuchet MS', Arial, sans-serif",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        background: "rgba(240,165,0,0.12)",
        color: "#F0A500",
        padding: "3px 10px",
        borderRadius: "100px",
      }}>
        {tag}
      </span>
    </div>
  );
}

const Divider = () => (
  <div style={{ height: "1px", background: "var(--border)", margin: "56px 0" }} />
);

export default function CreatorKit({ code, creatorName }: { code: string; creatorName: string }) {
  const signupUrl = `https://guitarstockalert.com/signup?ref=${code}`;
  const [linkCopied, setLinkCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(signupUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px 80px" }}>

      {/* Header */}
      <div style={{ padding: "56px 0 40px", borderBottom: "2px solid #F0A500", marginBottom: "48px" }}>
        <p style={{
          fontFamily: "'Trebuchet MS', Arial, sans-serif",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          color: "#F0A500",
          marginBottom: "14px",
        }}>
          🎸 Guitar Stock Alert
        </p>
        <h1 style={{
          fontFamily: "'Trebuchet MS', Arial, sans-serif",
          fontSize: "clamp(32px, 6vw, 52px)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          marginBottom: "16px",
        }}>
          {creatorName ? `${creatorName}'s Creator Kit` : "Your Creator Kit"}
        </h1>
        <p style={{ fontSize: "17px", color: "var(--text-muted)", maxWidth: "520px", lineHeight: 1.6 }}>
          Everything you need to promote Guitar Stock Alert — ready to copy, paste, and post.
          Every link below already has your code built in.
        </p>
      </div>

      {/* Link hero */}
      <div style={{
        background: "rgba(240,165,0,0.10)",
        border: "1.5px solid rgba(240,165,0,0.5)",
        borderRadius: "12px",
        padding: "24px 28px",
        marginBottom: "48px",
      }}>
        <p style={{
          fontFamily: "'Trebuchet MS', Arial, sans-serif",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase" as const,
          color: "#F0A500",
          marginBottom: "10px",
        }}>
          Your unique signup link
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
          <p style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "18px",
            fontWeight: 700,
            wordBreak: "break-all",
            margin: 0,
            flex: 1,
          }}>
            {signupUrl}
          </p>
          <button
            onClick={copyLink}
            style={{
              fontFamily: "'Trebuchet MS', Arial, sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              background: linkCopied ? "#22c55e" : "#F0A500",
              color: linkCopied ? "#fff" : "#0E1520",
              border: "none",
              borderRadius: "6px",
              padding: "7px 14px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {linkCopied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "'Trebuchet MS', Arial, sans-serif" }}>
          Anyone who signs up through your link gets a free 30-day trial — no credit card required. Your bounty is paid when they choose a plan at the end of that trial.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" }}>
        {[
          { value: "30", label: "Free days your audience gets through your link" },
          { value: "$5 / 33%", label: "Bounty per annual conversion ($14.99/yr plan)" },
          { value: "$2 / 33%", label: "Bounty per 30-day pass conversion ($5.99)" },
        ].map(({ value, label }) => (
          <div key={label} style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "18px 20px",
          }}>
            <div style={{
              fontFamily: "'Trebuchet MS', Arial, sans-serif",
              fontSize: "22px",
              fontWeight: 800,
              color: "#F0A500",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              marginBottom: "6px",
            }}>
              {value}
            </div>
            <div style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Payout note */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "rgba(240,165,0,0.07)",
        border: "1px solid rgba(240,165,0,0.25)",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "56px",
        fontSize: "13px",
        color: "var(--text-muted)",
        fontFamily: "'Trebuchet MS', Arial, sans-serif",
        lineHeight: 1.5,
      }}>
        <span style={{ color: "#F0A500", fontSize: "16px", flexShrink: 0 }}>💸</span>
        <span>Payouts are <strong style={{ color: "var(--text)" }}>biweekly</strong>, with <strong style={{ color: "var(--text)" }}>no minimum threshold</strong>. We'll pay you via your preferred method — just let us know when you reach out. <strong style={{ color: "var(--text)" }}>30-day attribution window</strong> — if someone clicks your link and signs up within 30 days, you get credit.</span>
      </div>

      {/* YouTube */}
      <Section title="YouTube" tag="Description + Comments" />

      <CopyBlock label="Video Description Blurb" text={`🎸 Never miss a Guitars Garden drop again\nGet text + email alerts as soon as new guitars hit the store — monitored around the clock.\nUse my link for a FREE 30-day trial — no credit card required:\n➡ ${signupUrl}\n\nGuitars Garden drops sell out fast. This is how I stay first in line.`} />
      <CopyBlock label="Pinned Comment" text={`👆 Link in the description for 30 days FREE — Guitars Garden drops move fast, this is how I never miss one 🎸`} />
      <CopyBlock label="End Screen Script (spoken)" text={`Before you go — if you shop at Guitars Garden, do yourself a favor and grab the link in the description. It's a free alert service, you get 30 days free through my link, and it'll text you as soon as something new drops. No card required, nothing to cancel during your trial. Link is down below.`} />

      <Divider />

      {/* TikTok / Reels */}
      <Section title="TikTok & Reels" tag="Short-Form" />

      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "18px 22px",
        marginBottom: "24px",
        fontSize: "14px",
        color: "var(--text-muted)",
        fontFamily: "'Trebuchet MS', Arial, sans-serif",
        lineHeight: 1.6,
      }}>
        <strong style={{ color: "var(--text)" }}>Hook first.</strong> You have 1–2 seconds. Lead with the pain point — missing a drop — before mentioning the solution.
      </div>

      <CopyBlock label="Opening Hook (spoken, first 2 seconds)" text={`"If you've ever been too late to a Guitars Garden drop, this is for you."`} />
      <CopyBlock label="Caption — Casual" text={`POV: you're always too late to Guitars Garden drops 😭 Found the fix — link in bio for 30 days FREE 🎸 #guitar #budgetguitar #guitarsgarden #guitartok #guitardeals`} />
      <CopyBlock label="Caption — Direct" text={`This thing texts me the second Guitars Garden drops new stock. Free trial through my link in bio — no card needed 🎸 #guitarshopping #budgetguitar #guitardeals`} />

      <Divider />

      {/* Instagram / Facebook */}
      <Section title="Instagram & Facebook" tag="Long-Form Post" />

      <CopyBlock label="Full Post" text={`🎸 If you shop at Guitars Garden, you need to know about this.\n\nThey drop new guitars regularly — sometimes multiple times a month — and the good ones go fast. I've started using Guitar Stock Alert, and it texts me as soon as something new hits the store.\n\nNo more refreshing the page. No more finding out after it's gone.\n\nThrough my link you get 30 days completely free — no credit card, nothing to cancel during the trial. After that it's $14.99 for the whole year ($1.25/month), or $5.99 for a 30-day pass if you want to try it paid first.\n\nLink in bio → ${signupUrl}\n\n#guitar #budgetguitar #guitarsgarden #guitardeals #electricguitar #guitarcommunity`} />

      <Divider />

      {/* Twitter / X */}
      <Section title="Twitter / X" tag="Short Posts" />

      <CopyBlock label="Tweet — Deal Angle" text={`Guitars Garden drops go fast. This service texts you the second they happen. 30 days free through my link, no card needed 🎸\n\n${signupUrl}`} />
      <CopyBlock label="Tweet — FOMO Angle" text={`tired of finding out about Guitars Garden drops after they're gone\n\n${signupUrl} ← free 30 days through my link`} />

      <Divider />

      {/* Video Scripts */}
      <Section title="Video Scripts" tag="Plug Scripts" />

      <CopyBlock label="15-Second Plug" text={`Real quick — if you shop at Guitars Garden, grab the link in the description. It texts you the second they drop new stock. My link gets you 30 days free, no card required. Link below.`} />
      <CopyBlock label="30-Second Plug" text={`This video is sponsored by Guitar Stock Alert — and honestly it's something I'd actually use. If you shop at Guitars Garden, you know how fast their drops sell out. This service watches the store around the clock and texts you as soon as something new hits. Email too, but the text is the thing — you're first in line before most people even know it dropped. Through my link in the description you get 30 days completely free, no credit card. After that it's $14.99 for the year, or $5.99 for a 30-day pass if you're not ready to commit. Link is below.`} />
      <CopyBlock label="60-Second Plug" text={`Before we get into it, shoutout to today's sponsor — Guitar Stock Alert. So here's the deal: if you've ever gone to Guitars Garden and seen something sold out that you had no idea even dropped, this is the fix.\n\nGuitar Stock Alert monitors the store around the clock and as soon as a new guitar appears — or something comes back in stock — it sends you a text message and an email. Not a daily digest, not a newsletter. An alert as soon as it happens.\n\nI've been using it and honestly the text is the killer feature. You're first in line before most people even have the tab open.\n\nThrough my link in the description you get 30 days completely free — no credit card, nothing to cancel during your trial. If you want to keep going after that it's $14.99 for the full year — that's $1.25 a month — or $5.99 for a 30-day pass if you're not ready to commit to a year.\n\nLink is in the description. Guitarstockalert.com through my link. Okay — let's get into the video.`} />

      <Divider />

      {/* Newsletter */}
      <Section title="Email Newsletter" tag="For Creators with Lists" />

      <CopyBlock label="Subject Line Options (pick one)" text={`Option A: Never be late to a Guitars Garden drop again\nOption B: How I stay first in line at Guitars Garden\nOption C: Free 30 days — Guitars Garden stock alerts`} />
      <CopyBlock label="Email Body" text={`Hey —\n\nQuick one this week. If you shop at Guitars Garden, I want to tell you about something I've been using.\n\nIt's called Guitar Stock Alert. It monitors Guitars Garden around the clock and sends you a text message and email as soon as new guitars drop — or anything comes back in stock.\n\nGuitars Garden drops can be gone same day. This puts you at the front of the line.\n\nThrough my link you get 30 days completely free. No credit card. No catch.\n\n→ ${signupUrl}\n\nAfter 30 days it's $14.99 for the full year if you want to keep it ($1.25/month). Or $5.99 for a 30-day pass if you're not ready to commit to a year.\n\nWorth it if you've ever missed a drop you wanted.\n\n— [YOUR NAME]`} />

      <Divider />

      {/* Talking Points */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "0 0 24px" }}>
        <span style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>Talking Points</span>
        <span style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, background: "rgba(240,165,0,0.12)", color: "#F0A500", padding: "3px 10px", borderRadius: "100px" }}>Know This Cold</span>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "28px 32px", marginBottom: "20px" }}>
        <p style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#F0A500", marginBottom: "18px" }}>
          If anyone asks, here&apos;s what to say
        </p>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            "Guitars Garden drops happen fast — sometimes the same day. This gets you there first.",
            "The service checks the store every hour, around the clock, 365 days.",
            "You get an email every time, plus an instant text if you add your phone number.",
            "The text is the real value — you know before most people even have the page open.",
            "Your link unlocks a free 30-day trial. They'll ask for a phone number — that's how the alerts are delivered. No credit card, nothing to auto-charge.",
            "After the trial it's $14.99 for a full year. Less than $1.25 a month.",
            "They also have a $5.99 option for 30 days if someone wants to try paid without committing to a year.",
            "30-day attribution window — if someone clicks your link and signs up anytime within the next 30 days, that conversion is credited to you.",
          ].map((point) => (
            <li key={point} style={{ display: "flex", gap: "12px", fontSize: "15px", lineHeight: 1.55 }}>
              <span style={{ color: "#F0A500", fontWeight: 700, flexShrink: 0, fontFamily: "'Trebuchet MS', Arial, sans-serif" }}>—</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <Divider />

      {/* FAQ */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "0 0 24px" }}>
        <span style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>FAQ</span>
        <span style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, background: "rgba(240,165,0,0.12)", color: "#F0A500", padding: "3px 10px", borderRadius: "100px" }}>Common Questions</span>
      </div>

      <div>
        {[
          { q: '"Is it really free? What\'s the catch?"', a: '30 days free through your link, no credit card required. After 30 days your alerts pause unless you subscribe. Nothing auto-charges.' },
          { q: '"What if nothing drops for a few weeks?"', a: "You'll still get notified when guitars come back in stock, not just new drops. And when drop season hits — especially fall — you'll be very glad you have it." },
          { q: '"Is this just for Guitars Garden?"', a: "Right now yes — it's purpose-built for Guitars Garden. That focus is what makes it actually useful instead of generic." },
          { q: '"Do I have to give my phone number?"', a: "Yes — a phone number is required to activate the free trial. It's how the alerts are delivered, which is the core value of the service. You can stop texts at any time by replying STOP, but a number is needed to sign up." },
          { q: '"How do I cancel?"', a: "Go to guitarstockalert.com/account, enter your email, and manage everything there. No phone call, no email, fully self-service." },
          { q: '"What if someone clicks my link but signs up later?"', a: "You still get credit. Your link carries a 30-day attribution window — anyone who clicks it and signs up within 30 days counts as your conversion." },
        ].map(({ q, a }, i, arr) => (
          <div key={q} style={{ borderBottom: "1px solid var(--border)", padding: "18px 0", borderTop: i === 0 ? "1px solid var(--border)" : undefined }}>
            <p style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif", fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>{q}</p>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.6 }}>{a}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
