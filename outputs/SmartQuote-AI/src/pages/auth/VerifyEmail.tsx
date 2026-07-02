import { MailCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";

export function VerifyEmail() {
  return (
    <AuthLayout title="Email verified" description="Your email verification is complete.">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <MailCheck className="size-6" />
        </div>
        <p className="text-sm text-muted-foreground">You can now sign in and start managing live quotes.</p>
        <Button asChild className="w-full"><Link to="/login">Continue to sign in</Link></Button>
      </div>
    </AuthLayout>
  );
}
