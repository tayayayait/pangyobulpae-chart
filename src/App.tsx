import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactNode, Suspense, lazy } from "react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useViewportWidth } from "./hooks/useViewportWidth";

const queryClient = new QueryClient();
const Auth = lazy(() => import("./pages/Auth"));
const Reports = lazy(() => import("./pages/Reports"));
const Editor = lazy(() => import("./pages/Editor"));
const Unsupported = lazy(() => import("./pages/Unsupported"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function ViewportGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const viewportWidth = useViewportWidth();
  const tooSmall = viewportWidth < 768;

  const isUnsupported = location.pathname === "/unsupported";
  const isDashboard = location.pathname === "/reports";
  if (tooSmall && !isUnsupported && !isDashboard) {
    return <Navigate to="/unsupported" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" visibleToasts={3} />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen grid place-items-center text-muted-foreground">로딩 중</div>}>
          <ViewportGate>
            <Routes>
              <Route path="/" element={<Navigate to="/reports" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/unsupported" element={<Unsupported />} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/reports/new" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
              <Route path="/reports/:id/edit" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ViewportGate>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
