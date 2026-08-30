"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";

import { login, type AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL: AuthFormState = { error: null };

/**
 * Registration redirects here with ?checkEmail=1, which only happens when the
 * project requires email confirmation. Without this notice the account exists
 * but nothing says so, and the first sign-in attempt fails with "Email not
 * confirmed" for no visible reason.
 *
 * The wording deliberately does not promise that a message has arrived. Until
 * a mail provider is configured, delivery goes through Supabase's shared SMTP,
 * which is rate-limited and slow; confirming the user from the dashboard is
 * the reliable path in the meantime.
 */
function CheckEmailNotice() {
  const shown = useSearchParams().get("checkEmail") === "1";
  if (!shown) return null;

  return (
    <p
      role="status"
      className="mb-4 rounded-md border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
    >
      Account created. It has to be confirmed before you can sign in.
    </p>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, INITIAL);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Access your contracts, escrow balance and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* useSearchParams needs a Suspense boundary to keep this page static. */}
          <Suspense fallback={null}>
            <CheckEmailNotice />
          </Suspense>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {state.error && (
              <p className="text-destructive text-sm" role="alert">
                {state.error}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              No account?{" "}
              <Link href="/register" className="underline underline-offset-4">
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
