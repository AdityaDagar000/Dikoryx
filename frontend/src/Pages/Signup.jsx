/**
 * Signup.jsx — DIKORYX Enterprise Analyst Enrollment
 *
 * Design system:
 *   Background  : deep navy-to-violet radial (#040814 → #0d0628)
 *   Glass card  : rgba(255,255,255,0.04) + backdrop-blur-2xl + 1px white/10 border
 *   Accent      : electric indigo #6C63FF with a violet variant #8B5CF6
 *   Noise layer : SVG turbulence at 3 % opacity — provides tactile texture
 *   Typography  : system-ui stack with tight tracking on headings
 *
 * Field mapping (matches backend POST /api/v1/signup exactly):
 *   name, middle_name, surname, country, email,
 *   phone_number, organisation, company_auth_token,
 *   username, password, confirmPassword (client-only)
 */

import { useState, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../components/ui/input-otp";
import logo from "../assets/logo.png"; /* Add this line */
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Globe,
  Hash,
  KeyRound,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { API } from "../api";
import bgVideo from "../assets/bg.mp4";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getFriendlyError(err) {
  const msg = (err?.message || "").toLowerCase();

  if (msg.includes("username already exists"))
    return "This username is already taken. Choose a different one.";
  if (msg.includes("email already exists"))
    return "An account with this email already exists. Sign in instead.";
  if (msg.includes("company_auth_token") || msg.includes("company auth token"))
    return "Invalid Company Auth Token. Contact your organisation administrator.";
  if (msg.includes("verification email") || msg.includes("smtp"))
    return "Account created, but the verification email failed to send. Check SMTP settings and try again.";
  if (msg.includes("missing fields") || msg.includes("required"))
    return "Please complete all required fields.";
  if (msg.includes("failed to fetch") || msg.includes("network"))
    return "Cannot reach the server. Check your connection and try again.";

  return err?.message || "Unable to create account. Please try again.";
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function Field({
  icon: Icon,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  suffix,
}) {
  const id = useId();
  return (
    <div className="signup-field">
      <label htmlFor={id} className="signup-field__label">
        {label}
        {required && <span className="signup-field__required">*</span>}
      </label>
      <div className="signup-field__control">
        {Icon && (
          <span className="signup-field__icon" aria-hidden="true">
            <Icon size={15} />
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="signup-field__input"
        />
        {suffix && <span className="signup-field__suffix">{suffix}</span>}
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, autoComplete, required }) {
  const [show, setShow] = useState(false);
  return (
    <Field
      icon={Lock}
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder="••••••••••••"
      autoComplete={autoComplete}
      required={required}
      suffix={
        <button
          type="button"
          className="signup-field__eye"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      }
    />
  );
}

// ─────────────────────────────────────────────
// CAPTCHA (simple checkbox — replace with
// reCAPTCHA / hCaptcha in production)
// ─────────────────────────────────────────────

function HumanCheck({ checked, onChange }) {
  return (
    <label className="signup-captcha">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="signup-captcha__box"
        required
      />
      <span className="signup-captcha__label">
        I hereby confirm that all the information provided by me is correct.
      </span>
    </label>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

const INITIAL_FORM = {
  name: "",
  middle_name: "",
  surname: "",
  country: "",
  email: "",
  phone_number: "",
  organisation: "",
  company_auth_token: "",
  username: "",
  password: "",
  confirmPassword: "",
};

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [humanChecked, setHumanChecked] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!humanChecked) {
      setError("Please confirm that the information provided is correct.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Payload matches backend POST /api/v1/signup exactly.
      // confirmPassword is intentionally excluded — it is client-side only.
      const data = await API.signup({
        name: form.name.trim(),
        middle_name: form.middle_name.trim() || undefined,
        surname: form.surname.trim(),
        country: form.country.trim(),
        email: form.email.trim().toLowerCase(),
        phone_number: form.phone_number.trim() || undefined,
        organisation: form.organisation.trim(),
        company_auth_token: form.company_auth_token.trim(),
        username: form.username.trim(),
        password: form.password,
      });

      navigate("/otp-verify", {
        state: {
          email: data?.email || form.email.trim().toLowerCase(),
          username: form.username.trim(),
          next: "/login",
          mode: "signup",
        },
      });
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Inline styles ────────────────────────────────────────────── */}
      <style>{`
        /* ── Reset / base ─────────────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Page shell ───────────────────────────────────────────── */
        .signup-page {
          min-height: 100dvh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 48px 16px 64px;
          background: #020104;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          position: relative;
          overflow: hidden;
        }

        .signup-bg-video {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 1;
          /* FIX: Perfect match to the 75% brightness of the Login page */
          filter: brightness(0.75) saturate(1.3) contrast(1.15);
          z-index: 0;
          pointer-events: none;
        }

        /* Subtle vignette overlay (matches the Login radial gradient) */
        .signup-page::before {
          content: "";
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.5) 100%);
          pointer-events: none;
          z-index: 1;
        }

        /* ── Card ─────────────────────────────────────────────────── */
        .signup-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 680px;
          border-radius: 24px;
          padding: 40px 40px 36px;
          overflow: hidden;
          
          /* FIX: Exact Glass formula from Login */
          background: rgba(15, 8, 30, 0.35);
          backdrop-filter: blur(24px) saturate(1.2);
          -webkit-backdrop-filter: blur(24px) saturate(1.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.1),
            0 24px 64px rgba(0, 0, 0, 0.5);
        }

        /* (Be sure you removed the .signup-card::before and ::after glow orbs from the previous code entirely!) */
        /* ── Header ───────────────────────────────────────────────── */
        .signup-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
        }
        .signup-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px; height: 48px;
          border-radius: 14px;
          /* Glassmorphic border and background to match Login page */
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-top: 1px solid rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.04);
          box-shadow: 0 8px 16px rgba(0,0,0,0.3), 0 0 24px rgba(142,5,194,0.25);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          flex-shrink: 0;
        }
        
        .signup-logo img {
          width: 26px;
          height: 26px;
          object-fit: contain;
        }
        .signup-brand { flex: 1; }
        .signup-brand__name {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #fff;
          line-height: 1;
        }
        .signup-brand__sub {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-top: 3px;
        }

        /* ── Section divider ──────────────────────────────────────── */
        .signup-section-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          /* Updated to DRACARYX Purple */
          color: #C084FC; 
          margin: 24px 0 14px;
        }
        .signup-section-title:first-of-type { margin-top: 0; }

        /* ── Grid ─────────────────────────────────────────────────── */
        .signup-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px; /* Slightly increased gap to let the inputs breathe */
        }
        .signup-grid--full {
          grid-column: 1 / -1;
        }
        @media (max-width: 540px) {
          .signup-grid { grid-template-columns: 1fr; }
          .signup-card { padding: 28px 20px 24px; }
        }

        /* ── Field ────────────────────────────────────────────────── */
        .signup-field { display: flex; flex-direction: column; gap: 6px; }
        .signup-field__label {
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.03em;
          color: rgba(255,255,255,0.6); /* Slightly brighter for readability */
        }
        .signup-field__required { color: #C084FC; margin-left: 2px; }
        
        .signup-field__control {
          display: flex;
          align-items: center;
          border-radius: 12px;
          /* Recessed Glassmorphism to match AuthShell */
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
          height: 48px; /* Fixed height for uniformity */
        }
        .signup-field__control:focus-within {
          background: rgba(0, 0, 0, 0.3);
          border-color: rgba(192, 132, 252, 0.5); /* #C084FC */
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.3),
            0 0 0 2px rgba(192, 132, 252, 0.15);
        }
        
        .signup-field__icon {
          display: flex;
          align-items: center;
          padding: 0 12px;
          color: rgba(255,255,255,0.3);
          flex-shrink: 0;
          transition: color 0.2s ease;
        }
        /* Icon lights up purple when the field is active */
        .signup-field__control:focus-within .signup-field__icon {
          color: #C084FC;
        }
        
        .signup-field__input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 13.5px;
          color: rgba(255,255,255,0.9);
          padding: 0 12px 0 0;
          min-width: 0;
          height: 100%;
        }
        .signup-field__input::placeholder { color: rgba(255,255,255,0.25); }
        
        .signup-field__suffix {
          display: flex;
          align-items: center;
          padding-right: 12px;
          flex-shrink: 0;
        }
        .signup-field__eye {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          padding: 2px;
          transition: color 0.15s;
        }
        .signup-field__eye:hover { color: #C084FC; }

        /* ── Captcha ──────────────────────────────────────────────── */
        /* ── Captcha / Consent ────────────────────────────────────── */
        .signup-captcha {
          display: flex;
          align-items: flex-start; /* Keeps checkbox at the top if text wraps */
          gap: 10px;
          margin-top: 20px;
          cursor: pointer;
          user-select: none;
        }
        .signup-captcha__box {
          width: 16px; height: 16px;
          margin-top: 2px;
          accent-color: #C084FC; /* Changed from #6C63FF */
          cursor: pointer;
          flex-shrink: 0;
        }
        .signup-captcha__label {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
        }

        /* ── Error banner ─────────────────────────────────────────── */
        .signup-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 18px;
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          font-size: 13px;
          color: #fca5a5;
          line-height: 1.5;
        }

        /* ── Submit button ────────────────────────────────────────── */
        .signup-submit {
          position: relative;
          width: 100%;
          margin-top: 20px;
          height: 48px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6C63FF 100%);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow:
            0 0 30px rgba(108,99,255,0.35),
            0 4px 16px rgba(0,0,0,0.4);
          transition: box-shadow 0.2s, opacity 0.2s, transform 0.15s;
          overflow: hidden;
        }
        .signup-submit::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .signup-submit:hover:not(:disabled) {
          box-shadow: 0 0 44px rgba(108,99,255,0.5), 0 4px 20px rgba(0,0,0,0.5);
          transform: translateY(-1px);
        }
        .signup-submit:active:not(:disabled) { transform: translateY(0); }
        .signup-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── Footer link ──────────────────────────────────────────── */
        .signup-footer {
          margin-top: 22px;
          text-align: center;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
        }
        .signup-footer a {
          color: #8B7CF6;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }
        .signup-footer a:hover { color: #fff; }

        /* ── Divider ──────────────────────────────────────────────── */
        .signup-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 22px 0 0;
        }
      `}</style>

      {/* ── Page ───────────────────────────────────────────────────────── */}
      <div className="signup-page">
        <video
          className="signup-bg-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
        <motion.div
          className="signup-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="signup-header">
            <div className="signup-logo">
              <img src={logo} alt="DRACARYX Logo" />
            </div>
            <div className="signup-brand">
              <div className="signup-brand__name">DRACARYX</div>
              <div className="signup-brand__sub">Enterprise Access</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* ── Section: Identity ─────────────────────────────────── */}
            <p className="signup-section-title">Identity</p>
            <div className="signup-grid">
              <Field
                icon={User}
                label="Name"
                value={form.name}
                onChange={set("name")}
                placeholder="First name"
                autoComplete="given-name"
                required
              />
              <Field
                icon={User}
                label="Middle Name"
                value={form.middle_name}
                onChange={set("middle_name")}
                placeholder="Middle name (optional)"
                autoComplete="additional-name"
              />
              <Field
                icon={User}
                label="Surname"
                value={form.surname}
                onChange={set("surname")}
                placeholder="Last name"
                autoComplete="family-name"
                required
              />
              <Field
                icon={Globe}
                label="Country"
                value={form.country}
                onChange={set("country")}
                placeholder="Country of residence"
                autoComplete="country-name"
                required
              />
            </div>

            {/* ── Section: Contact ──────────────────────────────────── */}
            <p className="signup-section-title">Contact</p>
            <div className="signup-grid">
              <div className="signup-grid--full" style={{ gridColumn: "1 / -1" }}>
                <Field
                  icon={Mail}
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="analyst@organisation.com"
                  autoComplete="email"
                  required
                />
              </div>
              <Field
                icon={Phone}
                label="Phone Number"
                type="tel"
                value={form.phone_number}
                onChange={set("phone_number")}
                placeholder="+1 555 000 0000 (optional)"
                autoComplete="tel"
              />
            </div>

            {/* ── Section: Organisation ─────────────────────────────── */}
            <p className="signup-section-title">Organisation</p>
            <div className="signup-grid">
              <Field
                icon={Building2}
                label="Organisation"
                value={form.organisation}
                onChange={set("organisation")}
                placeholder="Legal entity name"
                autoComplete="organization"
                required
              />
              
              {/* NEW: 8-Digit Glassmorphic OTP Input */}
              <div className="signup-field">
                <label className="signup-field__label">
                  Company Auth Token<span className="signup-field__required">*</span>
                </label>
                <div className="pt-1">
                  <InputOTP 
                    maxLength={8} 
                    value={form.company_auth_token}
                    onChange={set("company_auth_token")}
                    pattern="^[a-zA-Z0-9]+$" // Allows alphanumeric codes
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                      <InputOTPSlot index={6} />
                      <InputOTPSlot index={7} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </div>

            {/* ── Section: Credentials ──────────────────────────────── */}
            <p className="signup-section-title">Credentials</p>
            <div className="signup-grid">
              <Field
                icon={KeyRound}
                label="Username"
                value={form.username}
                onChange={set("username")}
                placeholder="Unique login handle"
                autoComplete="username"
                required
              />
              {/* spacer on desktop so username sits left */}
              <div aria-hidden="true" />
              <PasswordField
                label="Password"
                value={form.password}
                onChange={set("password")}
                autoComplete="new-password"
                required
              />
              <PasswordField
                label="Confirm Password"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                autoComplete="new-password"
                required
              />
            </div>

            {/* ── Human check ───────────────────────────────────────── */}
            <HumanCheck checked={humanChecked} onChange={setHumanChecked} />

            {/* ── Error ─────────────────────────────────────────────── */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="signup-error"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Submit ────────────────────────────────────────────── */}
            <button
              type="submit"
              className="signup-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account…" : "Create Account"}
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="signup-divider" />

          <p className="signup-footer">
            Already enrolled?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}
