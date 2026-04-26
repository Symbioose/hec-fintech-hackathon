import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { SpiderLogo } from "@/components/common/SpiderLogo";

export default function Login() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("francois.martin@carmignac.com");
  const [password, setPassword] = useState("demo");

  if (isAuthenticated) return <Navigate to="/" replace />;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    signIn(email || "francois.martin@carmignac.com");
    navigate("/");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--c-bg)",
        color: "var(--c-text)",
        fontFamily: "JetBrains Mono, monospace",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {/* Background grid pattern */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--c-border) 1px, transparent 1px), linear-gradient(90deg, var(--c-border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", width: "100%", maxWidth: 380 }}>
        {/* Top label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            fontSize: 9,
            color: "var(--c-text3)",
            letterSpacing: "0.12em",
            fontWeight: 700,
          }}
        >
          <span>WEBI / TERMINAL ACCESS</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--c-teal)",
                display: "inline-block",
                boxShadow: "0 0 6px rgba(74,222,128,0.5)",
              }}
              className="animate-pulse-slow"
            />
            <span style={{ color: "var(--c-teal)" }}>SECURE</span>
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--c-bg1)",
            border: "1px solid var(--c-border2)",
            borderRadius: 2,
            padding: 28,
          }}
        >
          {/* Logo + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <div
              style={{
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "var(--c-text)",
                border: "1px solid var(--c-border3)",
              }}
            >
              <SpiderLogo size={36} strokeWidth={1.5} />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--c-text)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Webi
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--c-text3)",
                    letterSpacing: "0.04em",
                  }}
                >
                  · We Buy
                </span>
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "var(--c-text3)",
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                }}
              >
                STRUCTURED PRODUCTS COPILOT
              </div>
            </div>
          </div>

          {/* Mandate banner */}
          <div
            style={{
              background: "var(--c-amber-bg)",
              border: "1px solid var(--c-amber-dim)",
              borderRadius: 2,
              padding: "10px 12px",
              marginBottom: 20,
              fontSize: 10,
              color: "var(--c-amber)",
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>
              CARMIGNAC CREDIT FUND A
            </div>
            <div style={{ color: "var(--c-text3)", letterSpacing: "0.04em" }}>
              EUR 1.24B AUM · UCITS Article 8 · IG senior only · 8 constraints
            </div>
          </div>

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field
              label="EMAIL"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@firm.com"
            />
            <Field
              label="PASSWORD"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />

            <button
              type="submit"
              style={{
                marginTop: 6,
                padding: "10px 16px",
                background: "var(--c-amber)",
                border: "none",
                borderRadius: 2,
                color: "#000",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.08em",
                transition: "filter 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
            >
              SIGN IN →
            </button>
          </form>

          <div
            style={{
              marginTop: 16,
              padding: "8px 10px",
              borderTop: "1px solid var(--c-border)",
              fontSize: 9,
              color: "var(--c-text3)",
              lineHeight: 1.6,
              letterSpacing: "0.04em",
            }}
          >
            <span style={{ color: "var(--c-text2)" }}>DEMO MODE:</span> any credentials accepted. You'll
            sign in as François Martin (Carmignac Credit Fund A).
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
            color: "var(--c-text3)",
            letterSpacing: "0.08em",
          }}
        >
          <span>v0.1.0-DEMO</span>
          <span>BUILD 25.04.26</span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          fontSize: 9,
          color: "var(--c-text3)",
          letterSpacing: "0.12em",
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "9px 12px",
          background: "var(--c-bg2)",
          border: "1px solid var(--c-border2)",
          borderRadius: 2,
          color: "var(--c-text)",
          fontSize: 12,
          fontFamily: "JetBrains Mono, monospace",
          outline: "none",
          transition: "border-color 0.1s",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--c-amber)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--c-border2)")}
      />
    </label>
  );
}
