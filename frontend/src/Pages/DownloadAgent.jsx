import { useMemo, useState } from "react";
import { Download, KeyRound, Lock, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API } from "../api";

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL || "https://insider-threat-detection-szmm.onrender.com").replace(/\/$/, "");

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("itd_user") || "null");
  } catch {
    return null;
  }
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function DownloadAgent() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [organizationName, setOrganizationName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [adminName, setAdminName] = useState(user?.name || user?.username || "");
  const [adminAuthToken, setAdminAuthToken] = useState("");
  const [organization, setOrganization] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canDownload = Boolean(organization?.enrollment_token);
  const generatedAdminToken = useMemo(() => {
    if (adminAuthToken.trim()) return adminAuthToken.trim();
    const seed = `${organization?.id || "org"}:${adminName || user?.username || "admin"}`;
    return btoa(seed).replace(/=+$/, "");
  }, [adminAuthToken, adminName, organization?.id, user?.username]);

  const createOrganization = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (organizationId.trim()) {
        const record = await API.getOrganization(organizationId.trim());
        setOrganization(record);
        setOrganizationName(record.name || organizationName);
        return;
      }

      if (!organizationName.trim()) {
        setError("Enter an organization name or existing organization ID.");
        return;
      }

      const record = await API.createOrganization({ name: organizationName.trim() });
      setOrganization(record);
      setOrganizationId(String(record.id));
    } catch (err) {
      setError(err.message || "Unable to prepare organization.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const windowsBootstrap = () => `# DIKORYX Windows Agent Bootstrap
# Generated for ${organization?.name || organizationName}

$BackendUrl = "${BACKEND_URL}"
$OrganizationId = "${organization?.id || organizationId}"
$OrganizationName = "${organization?.name || organizationName}"
$EnrollmentToken = "${organization?.enrollment_token || ""}"
$AdminName = "${adminName}"
$AdminAuthToken = "${generatedAdminToken}"

$InstallDir = "$env:ProgramData\\DIKORYX\\agent"
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

@"
backend_url: "$BackendUrl"
enrollment_token: "$EnrollmentToken"
heartbeat_interval: 10
"@ | Set-Content -Path "$InstallDir\\config.yaml" -Encoding UTF8

Write-Host "DIKORYX organization prepared:" -ForegroundColor Cyan
Write-Host "Organization: $OrganizationName"
Write-Host "Organization ID: $OrganizationId"
Write-Host "Enrollment token saved to $InstallDir\\config.yaml"
Write-Host ""
Write-Host "Place the DIKORYX agent files in $InstallDir, then run the agent using your Python environment." -ForegroundColor Yellow
`;

  const agentConfig = () => `backend_url: "${BACKEND_URL}"
enrollment_token: "${organization?.enrollment_token || ""}"
heartbeat_interval: 10
`;

  if (!user) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 py-28 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(142,5,194,0.28),transparent_38%),linear-gradient(135deg,#020617,#000)]" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <section className="relative z-10 w-full max-w-xl rounded-[2rem] border border-purple-500/20 bg-black/55 p-8 text-center shadow-[0_0_80px_rgba(142,5,194,0.22)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-[#C084FC]">
            <Lock size={30} />
          </div>
          <h1 className="mt-8 text-4xl font-black">Login required</h1>
          <p className="mx-auto mt-4 max-w-md text-gray-400">
            The DIKORYX agent download section is restricted to authenticated users. Please log in to continue.
          </p>
          <button
            type="button"
            onClick={() =>
              navigate("/login", {
                state: {
                  message: "Please log in to access the agent download section.",
                  next: "/download-agent",
                },
              })
            }
            className="mt-8 rounded-full bg-gradient-to-r from-[#3E065F] via-[#700B97] to-[#8E05C2] px-8 py-3 font-semibold shadow-[0_0_34px_rgba(142,5,194,0.34)]"
          >
            Go to Login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 pb-20 pt-32 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-purple-500/20 bg-black/45 p-8 shadow-[0_0_80px_rgba(142,5,194,0.14)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-purple-300">Agent Deployment</p>
              <h1 className="mt-4 text-5xl font-black tracking-normal">Download Windows Agent</h1>
              <p className="mt-4 max-w-2xl text-gray-400">
                Create or load an organization before downloading the Windows bootstrap. The organization is stored in
                the backend database and returns an enrollment token for endpoint onboarding.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-300">
              Signed in as <span className="font-semibold text-white">{user.name || user.username}</span>
            </div>
          </div>

          <form onSubmit={createOrganization} className="mt-10 grid gap-5 lg:grid-cols-2">
            <DownloadField
              label="Organization Name"
              value={organizationName}
              onChange={setOrganizationName}
              placeholder="Example: Acme Security Operations"
            />
            <DownloadField
              label="Existing Organization ID"
              value={organizationId}
              onChange={setOrganizationId}
              placeholder="Optional: load existing organization"
            />
            <DownloadField
              label="Admin Name"
              value={adminName}
              onChange={setAdminName}
              placeholder="Deployment administrator"
            />
            <DownloadField
              label="Admin Auth Token"
              value={adminAuthToken}
              onChange={setAdminAuthToken}
              placeholder="Optional internal admin token"
            />

            {error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm text-red-200 lg:col-span-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full border border-purple-400/30 bg-purple-500/10 px-6 py-4 font-semibold text-purple-100 transition hover:bg-purple-500/20 disabled:opacity-60 lg:col-span-2"
            >
              {isSubmitting ? "Preparing Organization..." : organizationId ? "Load / Prepare Organization" : "Create Organization"}
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/10 bg-black/35 p-7">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-[#C084FC]" />
              <h2 className="text-2xl font-black">Organization Record</h2>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard label="Organization Name" value={organization?.name || organizationName || "Not prepared"} />
              <InfoCard label="Organization ID" value={organization?.id || organizationId || "Pending"} />
              <InfoCard label="Enrollment Token" value={organization?.enrollment_token || "Create or load organization"} secret />
              <InfoCard label="Admin Auth Token" value={generatedAdminToken} secret />
            </div>
          </div>

          <div className="rounded-[2rem] border border-purple-500/20 bg-gradient-to-b from-[#11021d] to-black p-7">
            <div className="flex items-center gap-3">
              <Download className="text-[#C084FC]" />
              <h2 className="text-2xl font-black">Downloads</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-400">
              Download the Windows bootstrap and config after the organization exists. The bootstrap writes
              `config.yaml` with your backend URL and enrollment token.
            </p>
            <div className="mt-6 space-y-3">
              <button
                type="button"
                disabled={!canDownload}
                onClick={() => downloadTextFile("dikoryx-agent-windows-bootstrap.ps1", windowsBootstrap())}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3E065F] via-[#700B97] to-[#8E05C2] px-5 py-4 font-semibold shadow-[0_0_34px_rgba(142,5,194,0.34)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={18} />
                Download Windows Bootstrap
              </button>
              <button
                type="button"
                disabled={!canDownload}
                onClick={() => downloadTextFile("config.yaml", agentConfig())}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-4 font-semibold text-white/80 transition hover:border-[#8E05C2]/70 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <KeyRound size={18} />
                Download Agent Config
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function DownloadField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-full border border-white/10 bg-black/35 px-5 text-white outline-none transition placeholder:text-white/30 focus:border-[#8E05C2]/70 focus:shadow-[0_0_26px_rgba(142,5,194,0.18)]"
      />
    </label>
  );
}

function InfoCard({ label, value, secret = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-2 break-all font-mono text-sm text-white">{secret && value !== "Create or load organization" ? value : value}</p>
    </div>
  );
}
