"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Lock, Mail, CheckCircle, ShieldCheck, ShieldOff, Copy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AccountPage() {
  const { data: session, status: authStatus, update: updateSession } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [authStatus, router]);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await fetch("/api/admin/account");
        if (res.ok) {
          const data = await res.json();
          setName(data.name);
          setEmail(data.email);
        }
      } catch (error) {
        console.error("Failed to fetch account:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (authStatus === "authenticated") {
      fetchAccount();
    }
  }, [authStatus]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update");
      }

      setSuccess("Profile updated successfully");
      await updateSession({ name: data.name, email: data.email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      setSavingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      setSavingPassword(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setPasswordSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingPassword(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account details and security</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Update your name and email address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-md bg-green-100 text-green-800 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {success}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <TwoFactorSection />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {passwordError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-md bg-green-100 text-green-800 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {passwordSuccess}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={savingPassword}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={savingPassword}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={savingPassword}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Two-factor auth section
// ---------------------------------------------------------------------------

interface AccountStatus {
  totpEnabled: boolean;
}

function TwoFactorSection() {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup state
  const [setupQr, setSetupQr] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [enabling, setEnabling] = useState(false);

  // Recovery codes shown after enable / regenerate
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Disable state
  const [disablePassword, setDisablePassword] = useState("");
  const [disabling, setDisabling] = useState(false);

  const refresh = async () => {
    try {
      const res = await fetch("/api/admin/account");
      const data = await res.json();
      if (res.ok) {
        setStatus({ totpEnabled: Boolean(data.totpEnabled) });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const startSetup = async () => {
    setEnabling(true);
    try {
      const res = await fetch("/api/admin/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");
      setSetupQr(data.qrDataUri);
      setSetupSecret(data.secret);
      setSetupCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setEnabling(false);
    }
  };

  const confirmEnable = async () => {
    if (!setupCode || setupCode.length < 6) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }
    setEnabling(true);
    try {
      const res = await fetch("/api/admin/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: setupCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enable failed");
      setRecoveryCodes(data.recoveryCodes ?? []);
      setSetupQr(null);
      setSetupSecret(null);
      setSetupCode("");
      toast.success("2FA enabled. Save your recovery codes!");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enable failed");
    } finally {
      setEnabling(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisabling(true);
    try {
      const res = await fetch("/api/admin/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Disable failed");
      setDisablePassword("");
      toast.success("2FA disabled");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Disable failed");
    } finally {
      setDisabling(false);
    }
  };

  const regenerate = async () => {
    if (!confirm("Generate new recovery codes? Old codes will stop working immediately.")) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/admin/2fa/recovery-codes", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regenerate failed");
      setRecoveryCodes(data.recoveryCodes ?? []);
      toast.success("New recovery codes generated. Save them!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regenerate failed");
    } finally {
      setRegenerating(false);
    }
  };

  const copyCodes = () => {
    if (!recoveryCodes) return;
    navigator.clipboard.writeText(recoveryCodes.join("\n")).then(
      () => toast.success("Recovery codes copied to clipboard"),
      () => toast.error("Copy failed"),
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Two-factor authentication
        </CardTitle>
        <CardDescription>
          Add a second step at sign-in using an authenticator app (1Password, Google Authenticator, Authy, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recoveryCodes && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <strong>Save these recovery codes now.</strong> Each one can be used once if you lose access to your authenticator. You won&apos;t see them again.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-white border rounded p-3">
              {recoveryCodes.map((code) => (
                <div key={code}>{code}</div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyCodes}>
                <Copy className="mr-2 h-4 w-4" /> Copy all
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRecoveryCodes(null)}>
                I&apos;ve saved them
              </Button>
            </div>
          </div>
        )}

        {status?.totpEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-md border bg-green-50 border-green-200 p-3 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">2FA is enabled</div>
                <div className="text-green-800/80 text-xs">
                  You&apos;ll be asked for a code from your authenticator app every time you sign in.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={regenerate}
                disabled={regenerating}
              >
                {regenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Regenerate recovery codes
              </Button>
            </div>

            <form onSubmit={disable} className="space-y-3 border-t pt-4">
              <Label htmlFor="disable-password" className="flex items-center gap-2">
                <ShieldOff className="h-4 w-4" />
                Turn off 2FA
              </Label>
              <Input
                id="disable-password"
                type="password"
                placeholder="Confirm your password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
              />
              <Button type="submit" variant="destructive" size="sm" disabled={disabling}>
                {disabling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Disable 2FA
              </Button>
            </form>
          </div>
        ) : setupQr ? (
          <div className="space-y-4">
            <div className="text-sm">
              Scan this QR code with your authenticator app, then enter the 6-digit code it shows you.
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setupQr} alt="2FA QR code" className="rounded border bg-white p-2 w-60 h-60" />
            {setupSecret && (
              <div className="text-xs text-muted-foreground">
                Or enter this secret manually:{" "}
                <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{setupSecret}</code>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="setup-code">6-digit code</Label>
              <Input
                id="setup-code"
                inputMode="numeric"
                maxLength={6}
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value.replace(/\s+/g, ""))}
                placeholder="123456"
                className="font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmEnable} disabled={enabling || setupCode.length < 6}>
                {enabling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify and enable
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSetupQr(null);
                  setSetupSecret(null);
                  setSetupCode("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Once enabled, every sign-in will require a fresh code from your authenticator app.
            </p>
            <Button onClick={startSetup} disabled={enabling}>
              {enabling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Enable 2FA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
