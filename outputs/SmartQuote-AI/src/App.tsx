import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { Login } from "@/pages/auth/Login";
import { Register } from "@/pages/auth/Register";
import { VerifyEmail } from "@/pages/auth/VerifyEmail";
import { useWorkspacePreferences } from "@/hooks/use-workspace-preferences";

const Analytics = lazy(() => import("@/pages/Analytics").then((module) => ({ default: module.Analytics })));
const Clients = lazy(() => import("@/pages/Clients").then((module) => ({ default: module.Clients })));
const Dashboard = lazy(() => import("@/pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const Products = lazy(() => import("@/pages/Products").then((module) => ({ default: module.Products })));
const Quotes = lazy(() => import("@/pages/Quotes").then((module) => ({ default: module.Quotes })));
const Settings = lazy(() => import("@/pages/Settings").then((module) => ({ default: module.Settings })));

function PreferenceEffects() {
  const { preferences } = useWorkspacePreferences();

  useEffect(() => {
    document.documentElement.classList.toggle("smartquote-reduced-motion", !preferences.animations);
  }, [preferences.animations]);

  useEffect(() => {
    const accent = normalizeAccentColor(preferences.accentColor);
    const foreground = readableTextColor(accent);
    const root = document.documentElement;

    root.style.setProperty("--brand-accent", accent);
    root.style.setProperty("--primary", accent);
    root.style.setProperty("--primary-foreground", foreground);
    root.style.setProperty("--ring", accent);
    root.style.setProperty("--chart-1", accent);
    root.style.setProperty("--chart-2", "color-mix(in oklab, " + accent + " 68%, #2563eb)");
    root.style.setProperty("--accent", "color-mix(in oklab, " + accent + " 14%, var(--background))");
    root.style.setProperty("--accent-foreground", "color-mix(in oklab, " + accent + " 78%, var(--foreground))");
    root.style.setProperty("--accent-soft", "color-mix(in oklab, " + accent + " 12%, transparent)");
    root.style.setProperty("--accent-ring", "color-mix(in oklab, " + accent + " 32%, transparent)");
    root.style.setProperty("--accent-gradient", "linear-gradient(135deg, " + accent + ", color-mix(in oklab, " + accent + " 68%, #2563eb))");
  }, [preferences.accentColor]);

  return null;
}

function normalizeAccentColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#0f766e";
}

function readableTextColor(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.62 ? "#111827" : "#ffffff";
}

export default function App() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <PreferenceEffects />
      <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/quotes" element={<Quotes />} />
              <Route path="/products" element={<Products />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
