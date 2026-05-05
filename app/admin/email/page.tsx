"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Save, Send, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

type Settings = Record<string, string>;

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [original, setOriginal] = useState<Settings>({});
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/email");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load settings");
      setSettings(data.settings ?? {});
      setOriginal(data.settings ?? {});
      setConfigured(Boolean(data.configured));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dirty = useMemo(
    () => Object.keys(settings).some((k) => settings[k] !== original[k]),
    [settings, original],
  );

  const update = (key: string, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const updateBool = (key: string, value: boolean) => update(key, value ? "true" : "false");

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSettings(data.settings ?? settings);
      setOriginal(data.settings ?? settings);
      toast.success("Email settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!testTo) {
      toast.error("Enter a recipient address");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      if (data.skipped) {
        toast.warning("Email send was skipped — RESEND_API_KEY is not configured.");
      } else {
        toast.success(`Test email sent to ${testTo}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Mail className="h-6 w-6" /> Email
          </h1>
          <p className="text-muted-foreground">
            Transactional email — invites, password resets, inquiry notifications, audit confirmations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </div>

      {!configured && (
        <Card className="border-amber-300 bg-amber-50/40">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <strong>Email is not configured.</strong> Set the{" "}
              <code className="font-mono bg-amber-100 px-1 rounded">RESEND_API_KEY</code> environment
              variable and redeploy. Until then, transactional emails are logged to the server console
              instead of sent.
            </div>
          </CardContent>
        </Card>
      )}

      {configured && (
        <Card className="border-green-300 bg-green-50/40">
          <CardContent className="flex items-start gap-3 pt-6">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <strong>Resend is connected.</strong> Send a test email below to confirm your sender
              address is verified in Resend.
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sender</CardTitle>
          <CardDescription>
            Who emails come from. The sender domain must be verified in your Resend dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email_from_name">From name</Label>
              <Input
                id="email_from_name"
                value={settings.email_from_name ?? ""}
                onChange={(e) => update("email_from_name", e.target.value)}
                placeholder="Your Brand"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_from_address">From address</Label>
              <Input
                id="email_from_address"
                type="email"
                value={settings.email_from_address ?? ""}
                onChange={(e) => update("email_from_address", e.target.value)}
                placeholder="hello@yourdomain.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email_reply_to">Reply-to (optional)</Label>
              <Input
                id="email_reply_to"
                type="email"
                value={settings.email_reply_to ?? ""}
                onChange={(e) => update("email_reply_to", e.target.value)}
                placeholder="replies@yourdomain.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_notification_recipient">Notification recipient</Label>
              <Input
                id="email_notification_recipient"
                type="email"
                value={settings.email_notification_recipient ?? ""}
                onChange={(e) => update("email_notification_recipient", e.target.value)}
                placeholder="you@yourdomain.com"
              />
              <p className="text-xs text-muted-foreground">
                Where new inquiry and audit submission notifications are sent.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>Choose which transactional emails are sent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow
            label="Send team invites"
            description="When you invite a member, they receive a welcome email with the temporary password."
            checked={(settings.email_send_team_invites ?? "true") !== "false"}
            onCheckedChange={(v) => updateBool("email_send_team_invites", v)}
          />
          <Separator />
          <ToggleRow
            label="Send inquiry notifications"
            description="Email the notification recipient whenever someone submits the contact or audit form."
            checked={(settings.email_send_inquiry_notifications ?? "true") !== "false"}
            onCheckedChange={(v) => updateBool("email_send_inquiry_notifications", v)}
          />
          <Separator />
          <ToggleRow
            label="Send audit confirmations"
            description="Send an automatic confirmation email back to the lead when they submit the audit form."
            checked={(settings.email_send_audit_confirmations ?? "true") !== "false"}
            onCheckedChange={(v) => updateBool("email_send_audit_confirmations", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send a test email</CardTitle>
          <CardDescription>
            Confirms Resend is reachable, your sender domain is verified, and the branding template renders correctly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
            <Button onClick={sendTest} disabled={testing || !configured}>
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
