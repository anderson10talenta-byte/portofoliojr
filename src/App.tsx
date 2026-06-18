import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";

// Pages — Home is eager (public critical path)
import Home from "@/pages/Home";

// Public work detail page — lazy-loaded (not on critical path)
const WorkDetail = lazy(() => import("@/pages/WorkDetail"));

// Admin pages — lazy-loaded so they are excluded from the public homepage bundle
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Videos = lazy(() => import("@/pages/admin/Videos"));
const Photos = lazy(() => import("@/pages/admin/Photos"));
const Projects = lazy(() => import("@/pages/admin/Projects"));
const Designs = lazy(() => import("@/pages/admin/Designs"));
const SiteSettings = lazy(() => import("@/pages/admin/SiteSettings"));
const Companies = lazy(() => import("@/pages/admin/Companies"));
const Categories = lazy(() => import("@/pages/admin/Categories"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

function HomeFallback() {
  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    window.history.replaceState(null, "", `${base || ""}/`);
  }, []);

  return <Home />;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/work/:id">
        <Suspense fallback={null}>
          <WorkDetail />
        </Suspense>
      </Route>

      {/* Admin Routes — wrapped in Suspense; chunks are fetched only when /admin is visited */}
      <Route path="/admin/videos">
        <Suspense fallback={null}>
          <Videos />
        </Suspense>
      </Route>
      <Route path="/admin/photos">
        <Suspense fallback={null}>
          <Photos />
        </Suspense>
      </Route>
      <Route path="/admin/projects">
        <Suspense fallback={null}>
          <Projects />
        </Suspense>
      </Route>
      <Route path="/admin/designs">
        <Suspense fallback={null}>
          <Designs />
        </Suspense>
      </Route>
      <Route path="/admin/settings">
        <Suspense fallback={null}>
          <SiteSettings />
        </Suspense>
      </Route>
      <Route path="/admin/companies">
        <Suspense fallback={null}>
          <Companies />
        </Suspense>
      </Route>
      <Route path="/admin/categories">
        <Suspense fallback={null}>
          <Categories />
        </Suspense>
      </Route>
      <Route path="/admin">
        <Suspense fallback={null}>
          <Dashboard />
        </Suspense>
      </Route>

      {/* Keep malformed and stale public URLs from landing on a dead 404 page. */}
      <Route component={HomeFallback} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
