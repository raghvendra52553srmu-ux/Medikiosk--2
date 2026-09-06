import { useEffect, useRef, useState, } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { currentStaff, loginStaff, STAFF_LABELS, } from "@/services/authService";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * Wraps doctor / admin routes. Patients never see this — only staff roles.
 * Unlocked state survives refresh for the browser session; "Lock station"
 * clears it so the next person at the desk must re-enter credentials.
 */
export function StaffGate({
  role,
  children,
}

) {
  const navigate = useNavigate();
  const { setRole } = useApp();

  // Authority lives on the server. This component only reflects it — there is no
  // client-side flag that can be flipped to gain access.
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const identifierRef = useRef(null);

  // Restore an existing session from the httpOnly cookie on mount / role change.
  useEffect(() => {
    let alive = true;
    setChecking(true);
    setIdentifier("");
    setPassword("");
    setError("");

    currentStaff().then(found => {
      if (!alive) return;
      setUser(found && found.role === role ? found : null);
      setChecking(false);
    });

    return () => {
      alive = false;
    };
  }, [role]);

  const unlocked = Boolean(user);

  useEffect(() => {
    if (!checking && !unlocked) identifierRef.current?.focus();
  }, [checking, unlocked]);

  const meta = STAFF_LABELS[role];

  const submit = async (e) => {
    e?.preventDefault();
    if (!identifier.trim() || !password || submitting) return;

    setSubmitting(true);
    setError("");
    const result = await loginStaff(role, identifier, password);
    setSubmitting(false);

    if (result.ok) {
      setUser(result.user);
      setRole(role);
      setIdentifier("");
      setPassword("");
      return;
    }

    setError(result.message);
    setShaking(true);
    setPassword(""); // never leave a failed password in the field
    identifierRef.current?.focus();
    window.setTimeout(() => setShaking(false), 420);
  };

  // Verifying the cookie — avoid flashing the sign-in form at an already-signed-in clinician.
  if (checking) {
    return (
      <div className="app-ambient flex min-h-full items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-3" aria-busy="true" aria-live="polite">
          <span className="sr-only">Checking your session…</span>
          <Skeleton className="h-[60px] w-full rounded-[16px]" />
          <Skeleton className="h-[220px] w-full rounded-[20px]" />
        </div>
      </div>
);
  }

  /**
   * Once authenticated the gate gets out of the way. It used to render a
   * floating "Lock station" button here, but both staff layouts already carry
   * their own sign-out control — the floating copy overlapped the doctor
   * sidebar and gave two different controls for the same action.
   */
  if (unlocked) return <>{children}</>;

  return (
    <div className="app-ambient flex min-h-full items-center justify-center px-4 py-10">
      <div className="glass-strong w-full max-w-md rounded-[20px] p-6 sm:p-8">
        <button
          type="button"
          onClick={() => {
            setRole("patient");
            navigate("/");
          }}
          className="mb-5 flex items-center gap-1.5 text-base text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to kiosk home
        </button>

        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-ink text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <Badge tone="neutral" className="mb-2">
              Staff only
            </Badge>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.03em] text-ink">
              {meta.title}
            </h1>
            <p className="mt-1 text-base text-ink/55">{meta.who}</p>
          </div>
        </div>

        <p className="mt-5 mb-6 text-base leading-relaxed text-ink/65">{meta.hint}</p>

        <form onSubmit={submit} className={cn("space-y-4", shaking && "animate-[toast-in_0.4s_var(--ease-spring)]")}>
          <Input
            ref={identifierRef}
            label="Username or Email"
            type="text"
            placeholder={role === "doctor" ? "doctor / doctor@medikiosk.demo" : "admin / admin@medikiosk.demo"}
            value={identifier}
            onChange={e => {
              setIdentifier(e.target.value);
              if (error) setError("");
            }}
            required
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] flex h-8 w-8 items-center justify-center rounded-md text-ink/60 transition-colors hover:bg-ink/[0.04] hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-base font-medium text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
)}

          <Button
            type="submit"
            size="lg"
            fullWidth
            className="mt-6"
            disabled={!identifier.trim() || !password || submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
          🔒 Private station — Authorized hospital staff only.
          <br />
          Patients should use the open kiosk on the home screen.
        </p>
      </div>
    </div>
);
}
