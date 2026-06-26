import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AuthShell from "../components/AuthShell";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp";
import { API } from "../api"; // Added back the API import!

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const destination = location.state?.next || "/welcome";
  const mode = location.state?.mode || "login";

  const maskedTarget = useMemo(() => {
    const email = location.state?.email;
    const username = location.state?.username;

    if (email) return email;
    if (username) return `${username}@dracaryx.local`;

    return "your registered email";
  }, [location.state]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError("Please enter all 4 digits.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // RESTORED: Your actual backend verification logic
      const result = await API.verifyOtp({
        email: location.state?.email,
        otp: otp,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // RESTORED: Saving the session so the Bouncer lets you in!
      localStorage.setItem(
        "itd_user",
        JSON.stringify({
          user_id: result.user_id,
          username: result.username,
          agent_id: result.agent_id,
          name: result.name,
          email: result.email,
          department: result.department,
          photo_url: result.photo_url,
        })
      );

      if (result.agent_id) {
        localStorage.setItem("selected_agent", result.agent_id);
      }

      navigate(destination, {
        state: {
          message:
            mode === "signup"
              ? "Account created successfully. You can now log in."
              : undefined,
        },
      });
    } catch (err) {
      console.error(err);
      setError(err?.message || "OTP verification failed.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    
    setIsResending(true);
    setError("");
    
    try {
      // Add your resend OTP API call here if you have one on the backend
      // await API.resendOtp({ email: location.state?.email });
      
      await new Promise((res) => setTimeout(res, 800));
      setCooldown(30);
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Security Check"
      title="Verification"
      subtitle={`Enter the 4-digit code sent to ${maskedTarget}`}
    >
      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-8 mt-2">
        <InputOTP
          maxLength={4}
          value={otp}
          onChange={(value) => {
            setOtp(value);
            setError("");
          }}
          autoFocus
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>

        <button
          type="submit"
          disabled={loading || otp.length < 4}
          className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#3E065F] via-[#700B97] to-[#8E05C2] font-semibold text-white shadow-[0_0_34px_rgba(142,5,194,0.34)] transition hover:shadow-[0_0_46px_rgba(142,5,194,0.52)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{loading ? "Verifying..." : "Verify Identity"}</span>
          <ArrowRight className="absolute right-5 h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-white/45">
        Didn't get the code?{" "}
        <button 
          type="button" 
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          className="font-medium text-[#C084FC] transition hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
        </button>
      </div>

      <p className="mt-8 text-center text-xs leading-5 text-white/30">
        By continuing, you agree to our{" "}
        <Link to="/resources/terms-of-service" className="hover:text-white transition">Terms of Service</Link>{" "}
        &{" "}
        <Link to="/resources/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>.
      </p>
    </AuthShell>
  );
}