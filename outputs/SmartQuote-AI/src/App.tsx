import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { Login } from "@/pages/auth/Login";
import { Register } from "@/pages/auth/Register";
import { VerifyEmail } from "@/pages/auth/VerifyEmail";

const Analytics = lazy(() => import("@/pages/Analytics").then((module) => ({ default: module.Analytics })));
const Clients = lazy(() => import("@/pages/Clients").then((module) => ({ default: module.Clients })));
const Dashboard = lazy(() => import("@/pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const Products = lazy(() => import("@/pages/Products").then((module) => ({ default: module.Products })));
const Quotes = lazy(() => import("@/pages/Quotes").then((module) => ({ default: module.Quotes })));
const Settings = lazy(() => import("@/pages/Settings").then((module) => ({ default: module.Settings })));

export default function App() {
  return (
    <Suspense fallback={<AuthLoading />}>
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
