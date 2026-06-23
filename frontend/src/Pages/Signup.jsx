import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Eye, EyeOff, ImagePlus, Lock, Mail, User } from "lucide-react";
import { API } from "../api";
import AuthShell, { AuthField } from "../components/AuthShell";

const initialForm = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  department: "",
  password: "",
  confirmPassword: "",
};

function getFriendlySignupError(error) {
  const message = (error?.message || "").toLowerCase();

  if (message.includes("backend endpoint unavailable")) {
    return "The deployed backend is missing the signup API. Redeploy the latest backend on Render.";
  }

  if (message.includes("user exists")) {
    return "This username already exists. Please sign in or choose another username.";
  }

  if (message.includes("missing fields")) {
    return "Please complete all required signup fields.";
  }

  if (message.includes("failed to fetch") || message.includes("network")) {
    return "Backend is not reachable. Please check your network or Render backend status.";
  }

  return error?.message || "Unable to create account. Please try again.";
}

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const displayName = `${form.firstName} ${form.lastName}`.trim();
      const data = await API.signup({
        username: form.username.trim(),
        password: form.password,
        name: displayName,
        email: form.email.trim(),
        department: form.department.trim(),
        photo_url: photoPreview,
      });

      navigate("/otp-verify", {
        state: {
          email: form.email,
          username: form.username,
          agentId: data?.agent_id,
          next: "/login",
          mode: "signup",
        },
      });
    } catch (err) {
      setError(getFriendlySignupError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Secure Enrollment"
      title="Create Account"
      subtitle="Register DIKORYX analyst access"
      maxWidth="max-w-4xl"
    >
      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-white/10 bg-black/35 p-5 text-left shadow-[0_0_70px_rgba(142,5,194,0.12)] backdrop-blur-xl sm:p-6"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthField
                icon={User}
                label="First Name"
                value={form.firstName}
                onChange={(value) => updateField("firstName", value)}
                placeholder="First name"
                autoComplete="given-name"
              />
              <AuthField
                icon={User}
                label="Last Name"
                value={form.lastName}
                onChange={(value) => updateField("lastName", value)}
                placeholder="Last name"
                autoComplete="family-name"
              />
              <AuthField
                icon={User}
                label="Username"
                value={form.username}
                onChange={(value) => updateField("username", value)}
                placeholder="Username"
                autoComplete="username"
              />
              <AuthField
                icon={Mail}
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) => updateField("email", value)}
                placeholder="name@company.com"
                autoComplete="email"
              />
              <AuthField
                icon={Building2}
                label="Department"
                value={form.department}
                onChange={(value) => updateField("department", value)}
                placeholder="Security Operations"
                autoComplete="organization-title"
              />
              <AuthField
                icon={Lock}
                label="Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(value) => updateField("password", value)}
                placeholder="Password"
                autoComplete="new-password"
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
            </div>

            <AuthField
              icon={Lock}
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(value) => updateField("confirmPassword", value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              action={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="ml-3 text-white/35 transition hover:text-white"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-200/70">Profile Identity</p>
            <div className="mx-auto mt-5 flex h-40 w-40 items-center justify-center overflow-hidden rounded-[2rem] border border-purple-400/20 bg-black/40 shadow-[inset_0_0_28px_rgba(142,5,194,0.12)]">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-10 w-10 text-white/35" />
              )}
            </div>
            <label className="mt-5 inline-flex cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:border-[#8E05C2]/70 hover:text-white">
              Upload photo
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
            <p className="mt-4 text-xs leading-5 text-white/35">
              Stored as `photo_url` for the user record returned by your backend.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative mt-6 flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#3E065F] via-[#700B97] to-[#8E05C2] font-semibold text-white shadow-[0_0_34px_rgba(142,5,194,0.34)] transition hover:shadow-[0_0_46px_rgba(142,5,194,0.52)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isSubmitting ? "Creating Account..." : "Create Account"}</span>
          <ArrowRight className="absolute right-5 h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/45">
        Already registered?{" "}
        <Link to="/login" className="font-medium text-[#C084FC] transition hover:text-white">
          Back to Login
        </Link>
      </p>
    </AuthShell>
  );
}
