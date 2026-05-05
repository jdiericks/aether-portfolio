"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [twoFaRequired, setTwoFaRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        totpCode: twoFaRequired ? totpCode : "",
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "2FA_REQUIRED") {
          setTwoFaRequired(true);
          toast.info("Enter the 6-digit code from your authenticator app.");
        } else if (result.error === "2FA_INVALID") {
          toast.error("Invalid 2FA code. Try again or use a recovery code.");
        } else if (result.error === "CredentialsSignin") {
          toast.error("Invalid email or password");
          setTwoFaRequired(false);
          setTotpCode("");
        } else {
          toast.error(result.error);
        }
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <span className="font-semibold text-xl">Real Estate</span>
            <span className="text-sm text-muted-foreground tracking-widest uppercase">Admin</span>
          </Link>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access a property packet or manage the website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || twoFaRequired}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || twoFaRequired}
              />
            </div>
            {twoFaRequired && (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                <Label htmlFor="totp" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Authenticator code
                </Label>
                <Input
                  id="totp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456 or recovery-code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  required
                  disabled={isLoading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Use a 6-digit code from your authenticator app, or one of your recovery codes.
                </p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? "Signing in..."
                : twoFaRequired
                  ? "Verify and sign in"
                  : "Sign In"}
            </Button>
            {twoFaRequired && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setTwoFaRequired(false);
                  setTotpCode("");
                }}
              >
                Use a different account
              </Button>
            )}
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:underline">
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
