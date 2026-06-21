import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, ShieldCheck, User } from "lucide-react";
import { API } from "../api";
import AuthShell, { AuthField } from "../components/AuthShell";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "", otp: "", authToken: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successMessage = location.state?.message;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const data = await API.login({
        username: form.username,
        password: form.password,
      });
      const user = data?.user || data;
      localStorage.setItem("itd_user", JSON.stringify(user));

      if (user?.agent_id) {
        localStorage.setItem("selected_agent", user.agent_id);
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to sign in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Enterprise Access"
      title="Welcome Analyst"
      subtitle="Secure DIKORYX sign in"
    >
      {successMessage && (
        <div className="mb-5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-full border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          icon={User}
          label="Username"
          value={form.username}
          onChange={(value) => updateField("username", value)}
          placeholder="agent.username"
          autoComplete="username"
        />

        <AuthField
          icon={Lock}
          label="Password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(value) => updateField("password", value)}
          placeholder="password"
          autoComplete="current-password"
          action={
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="ml-3 text-white/35 transition hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4 flex items-center justify-between text-left">
            <div>
              <p className="text-sm font-semibold text-white">OTP and Auth Token</p>
              <p className="mt-1 text-xs text-white/35">Use these fields when your enterprise policy requires MFA.</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-[#8E05C2]" />
          </div>

          <div className="space-y-4">
            <AuthField
              icon={KeyRound}
              label="OTP Code"
              value={form.otp}
              onChange={(value) => updateField("otp", value)}
              placeholder="One-time password"
              autoComplete="one-time-code"
              required={false}
            />

            <AuthField
              icon={ShieldCheck}
              label="Auth Token"
              value={form.authToken}
              onChange={(value) => updateField("authToken", value)}
              placeholder="Authentication token"
              autoComplete="off"
              required={false}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#3E065F] via-[#700B97] to-[#8E05C2] font-semibold text-white shadow-[0_0_34px_rgba(142,5,194,0.34)] transition hover:shadow-[0_0_46px_rgba(142,5,194,0.52)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isSubmitting ? "Authenticating..." : "Login"}</span>
          <ArrowRight className="absolute right-5 h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </form>

      <p className="pt-10 text-xs leading-5 text-white/30">
        Authorized access only. Activity may be monitored for enterprise security and compliance.
      </p>
    </AuthShell>
  );
}
