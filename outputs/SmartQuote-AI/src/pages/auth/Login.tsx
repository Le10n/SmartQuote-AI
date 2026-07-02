import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/errors";
import { env } from "@/lib/env";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginForm = z.infer<typeof schema>;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function Login() {
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const form = useForm<LoginForm>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  async function completeSignIn(email: string, password: string) {
    setSubmitting(true);
    setSuccess(false);
    try {
      await signIn(email, password);
      setSuccess(true);
      toast.success("Welcome back", env.demoMode ? "Entering the demo workspace." : "You are signed in to SmartQuote AI.");
      await wait(650);
      navigate(from, { replace: true });
    } catch (error) {
      toast.error("Sign in failed", getErrorMessage(error));
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(values: LoginForm) {
    await completeSignIn(values.email, values.password);
  }

  return (
    <AuthLayout title={env.demoMode ? "Enter demo workspace" : "Sign in"} description={env.demoMode ? "Explore SmartQuote AI with rich local demo data. No account required." : "Access your secure quote workspace."} busy={submitting} success={success}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          if (env.demoMode) {
            event.preventDefault();
            void completeSignIn("", "");
            return;
          }

          void form.handleSubmit(onSubmit)(event);
        }}
      >
        {env.demoMode ? (
          <motion.div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white"><Sparkles className="size-4" /></div>
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Demo mode is enabled</p>
                <p className="mt-1 text-sm leading-6 text-emerald-700/85 dark:text-emerald-200/80">Clients, products, quotes, dashboard metrics, AI responses, and PDFs run from localStorage.</p>
              </div>
            </div>
          </motion.div>
        ) : null}

        {!env.demoMode ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="name@company.com" data-cursor="Edit" {...form.register("email")} />
              <AnimatePresence>
                {form.formState.errors.email ? <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-sm text-destructive">Enter a valid email.</motion.p> : null}
              </AnimatePresence>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                <Link className="text-sm text-muted-foreground transition-colors hover:text-foreground" to="/forgot-password" data-cursor="Open">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" className="pr-10" data-cursor="Edit" {...form.register("password")} />
                <button type="button" className="absolute right-2 top-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} data-cursor="Click">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <AnimatePresence>
                {form.formState.errors.password ? <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-sm text-destructive">Password must be at least 6 characters.</motion.p> : null}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground" data-cursor="Click">
                <input type="checkbox" className="size-4 rounded border-border accent-primary" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                Remember me
              </label>
              <span className="text-xs text-muted-foreground">Secure session</span>
            </div>
          </>
        ) : null}

        <Button className="h-11 w-full" type="submit" disabled={submitting} variant="premium" data-cursor={env.demoMode ? "Open" : "Click"}>
          <AnimatePresence mode="wait" initial={false}>
            {success ? (
              <motion.span key="success" className="inline-flex items-center gap-2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}><CheckCircle2 className="size-4" />Success</motion.span>
            ) : submitting ? (
              <motion.span key="loading" className="inline-flex items-center gap-2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}><Loader2 className="size-4 animate-spin" />Signing in...</motion.span>
            ) : (
              <motion.span key="idle" className="inline-flex items-center gap-2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>{env.demoMode ? "Enter Demo Workspace" : "Sign in"}<ArrowRight className="size-4" /></motion.span>
            )}
          </AnimatePresence>
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {env.demoMode ? "For demonstration purposes only." : <>New to SmartQuote AI? <Link className="font-medium text-foreground" to="/register" data-cursor="Open">Create an account</Link></>}
        </p>
      </form>
    </AuthLayout>
  );
}
