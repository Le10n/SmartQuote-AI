import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";

const schema = z.object({
  companyName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type RegisterForm = z.infer<typeof schema>;

export function Register() {
  const { signUp } = useAuth();
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<RegisterForm>({ resolver: zodResolver(schema), defaultValues: { companyName: "", email: "", password: "" } });

  async function onSubmit(values: RegisterForm) {
    setSubmitting(true);
    try {
      await signUp(values.email, values.password, values.companyName);
      setSent(true);
      toast.success("Check your inbox", "We sent an email verification link.");
    } catch (error) {
      toast.error("Registration failed", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create account" description="Start with secure authentication and workspace isolation.">
      {sent ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Your workspace is ready. Verify your email address, then sign in.</p>
          <Button asChild className="w-full"><Link to="/login">Go to sign in</Link></Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" {...form.register("companyName")} />
            {form.formState.errors.companyName ? <p className="text-sm text-destructive">Company name is required.</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-sm text-destructive">Enter a valid email.</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
            {form.formState.errors.password ? <p className="text-sm text-destructive">Use at least 8 characters.</p> : null}
          </div>
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? "Creating account" : "Create account"}
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link className="font-medium text-foreground" to="/login">Sign in</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
