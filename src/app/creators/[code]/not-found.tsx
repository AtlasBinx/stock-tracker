export default function CreatorNotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background)",
        color: "var(--text)",
        padding: "24px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <p style={{ fontSize: "48px", marginBottom: "16px" }}>🎸</p>
        <h1
          style={{
            fontFamily: "'Trebuchet MS', Arial, sans-serif",
            fontSize: "24px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: "12px",
          }}
        >
          Link not found
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "28px" }}>
          This creator link doesn&apos;t exist or has been deactivated.
          If you received this link from a creator, reach out to them for an updated one.
        </p>
        <a
          href="/signup"
          style={{
            display: "inline-block",
            backgroundColor: "#6366f1",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Sign up directly →
        </a>
      </div>
    </div>
  );
}
