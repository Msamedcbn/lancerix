"use client";

import Link from "next/link";
import { useActionState } from "react";

import { register, type AuthFormState } from "@/app/(auth)/actions";
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

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, INITIAL);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Freelancers issue invoices; clients fund escrow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm leading-none font-medium">
                I am a
              </legend>
              <div className="flex gap-4 pt-1">
                <Label htmlFor="role-freelancer" className="font-normal">
                  <input
                    id="role-freelancer"
                    type="radio"
                    name="role"
                    value="FREELANCER"
                    defaultChecked
                  />
                  Freelancer
                </Label>
                <Label htmlFor="role-client" className="font-normal">
                  <input
                    id="role-client"
                    type="radio"
                    name="role"
                    value="CLIENT"
                  />
                  Client
                </Label>
              </div>
            </fieldset>
            {state.error && (
              <p className="text-destructive text-sm" role="alert">
                {state.error}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create account"}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Already registered?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
