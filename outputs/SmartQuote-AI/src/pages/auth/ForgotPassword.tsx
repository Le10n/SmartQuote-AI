import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
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

const schema = z.object({ email: z.string().email() });
type ForgotPasswordForm = z.infer<typeof schema>;

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<ForgotPasswordForm>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(values: ForgotPasswordForm) {
    setSubmitting(true);
    try {
      await resetPassword(values.email);
      toast.success("Reset email sent", "Check your inbox for the password reset link.");
    } catch (error) {
      toast.error("Reset failed", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Reset password" description="Receive a secure password reset link.">
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email ? <p className="text-sm text-destructive">Enter a valid email.</p> : null}
        </div>
        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? "Sending" : "Send reset link"}
          <Send className="size-4" />
        </Button>
        <p className="text-center text-sm text-muted-foreground"><Link className="font-medium text-foreground" to="/login">Back to sign in</Link></p>
      </form>
    </AuthLayout>
  );
}
