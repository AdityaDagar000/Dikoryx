import { useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./otp.css";

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputsRef = useRef([]);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");

  const destination = location.state?.next || "/dashboard";
  const mode = location.state?.mode || "login";
  const maskedTarget = useMemo(() => {
    const email = location.state?.email;
    const username = location.state?.username;
    if (email) return email;
    if (username) return `${username}@dikoryx.local`;
    return "your registered email";
  }, [location.state]);

  const updateDigit = (index, value) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setError("");

    if (clean && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const code = digits.join("");

    if (code.length !== 4) {
      setError("Enter the 4 digit verification code.");
      return;
    }

    navigate(destination, {
      state: {
        message: mode === "signup" ? "Account created successfully. You can now log in." : undefined,
      },
    });
  };

  return (
    <main className="otp-page">
      <div className="otp-line-field" />
      <section className="otp-card">
        <div className="otp-lightning" aria-hidden="true">
          &#9889;
        </div>

        <h1>Enter verification code</h1>
        <p>
          We emailed a verification code to <strong>{maskedTarget}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="otp-input-row">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputsRef.current[index] = element;
                }}
                value={digit}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                className="otp-digit"
                inputMode="numeric"
                maxLength={1}
                aria-label={`OTP digit ${index + 1}`}
              />
            ))}
          </div>

          {error && <div className="otp-error">{error}</div>}

          <button type="submit" className="otp-submit">
            Verify
          </button>
        </form>

        <div className="otp-resend">
          Didn't get the code? <button type="button">Resend</button>
        </div>

        <p className="otp-legal">
          By continuing, you agree to our <Link to="/resources/terms-of-service">Terms of Service</Link> &{" "}
          <Link to="/resources/privacy-policy">Privacy Policy</Link>.
        </p>
      </section>
    </main>
  );
}
