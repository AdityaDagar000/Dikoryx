import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import { API } from "../api";
import AuthShell, { AuthField } from "../components/AuthShell";

function getFriendlyAuthError(error) {
  const message = (error?.message || "").toLowerCase();

  if (message.includes("backend endpoint unavailable")) {
    return "The deployed backend is missing the login API. Redeploy the latest backend on Render.";
  }

  if (message.includes("user not found") || message.includes("not found")) {
    return "Not registered user. Kindly contact the sales team.";
  }

  if (message.includes("invalid password") || message.includes("invalid")) {
    return "Invalid username or password.";
  }

  if (message.includes("failed to fetch") || message.includes("network")) {
    return "Backend is not reachable. Please check your network or Render backend status.";
  }

  return error?.message || "Authentication failed. Kindly contact the sales team.";
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successMessage = location.state?.message;
  const nextPath = location.state?.next || "/dashboard";

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await API.login({
        username: form.username.trim(),
        password: form.password,
      });

      const user = {
        user_id: data.user_id,
        username: data.username,
        agent_id: data.agent_id,
        name: data.name,
        email: data.email,
        department: data.department,
        photo_url: data.photo_url,
      };

      localStorage.setItem("itd_user", JSON.stringify(user));

      if (data.agent_id) {
        localStorage.setItem("selected_agent", data.agent_id);
      }

      navigate("/otp-verify", {
        state: {
          email: data.email,
          username: data.username,
          next: nextPath,
          mode: "login",
        },
      });
    } catch (err) {
      setError(getFriendlyAuthError(err));
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
        <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm text-red-200">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#3E065F] via-[#700B97] to-[#8E05C2] font-semibold text-white shadow-[0_0_34px_rgba(142,5,194,0.34)] transition hover:shadow-[0_0_46px_rgba(142,5,194,0.52)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isSubmitting ? "Authenticating..." : "Login"}</span>
          <ArrowRight className="absolute right-5 h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-white/35">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <p className="text-center text-sm text-white/45">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-[#C084FC] transition hover:text-white">
          Signup
        </Link>
      </p>

      <p className="pt-10 text-xs leading-5 text-white/30">
        Connected to the DIKORYX backend. Authorized access only.
      </p>
    </AuthShell>
  );
}
