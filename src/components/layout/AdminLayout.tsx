import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Video, Image as ImageIcon, FolderKanban, PenTool, LogOut, Loader2, Settings2, Building2, Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location] = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/check", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.isAdmin) {
          setIsAdmin(true);
        } else {
          window.location.href = "/";
        }
      })
      .catch(() => {
        window.location.href = "/";
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Videos", href: "/admin/videos", icon: Video },
    { name: "Photos", href: "/admin/photos", icon: ImageIcon },
    { name: "Designs", href: "/admin/designs", icon: PenTool },
    { name: "Categories", href: "/admin/categories", icon: Tags },
    { name: "Projects", href: "/admin/projects", icon: FolderKanban },
    { name: "Companies", href: "/admin/companies", icon: Building2 },
    { name: "Website", href: "/admin/settings", icon: Settings2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0d0d] to-background flex">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-72 bg-gradient-to-b from-card via-[#121515] to-card/80 border-r border-white/5 flex-col shadow-xl">
        <div className="p-6 border-b border-white/8 bg-white/2 backdrop-blur">
          <Link href="/" className="font-display text-lg font-bold tracking-wider bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            RICHARD<span className="text-[#d4a454]">ADMIN</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#d4a454]/15 to-[#d4a454]/5 text-white border border-[#d4a454]/30 shadow-md shadow-[#d4a454]/10"
                    : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-[#d4a454]" : ""} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/8 bg-white/2 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a454] to-[#e3b66c] flex items-center justify-center text-black font-bold text-sm">
              RJ
            </div>
            <div>
              <p className="text-sm font-bold text-white">Richard Juan</p>
              <p className="text-xs text-white/40">Administrator</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-400/80 hover:text-red-300 hover:bg-red-500/10 border border-red-500/10 transition-all"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top header */}
        <header className="h-16 md:h-20 bg-gradient-to-r from-background/95 to-background/90 backdrop-blur-xl border-b border-white/8 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-sm">
          <h1 className="text-lg md:text-2xl font-display font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{title}</h1>
          {/* Mobile logout button */}
          <button
            onClick={handleLogout}
            className="md:hidden w-10 h-10 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-all hover:shadow-md hover:shadow-red-500/10"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </header>

        {/* Page content — leaves room for bottom nav on mobile */}
        <div className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-card via-card/95 to-card/90 backdrop-blur-xl border-t border-white/10 shadow-2xl">
        <div className="flex items-stretch overflow-x-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex w-16 shrink-0 flex-col items-center justify-center gap-1 py-3 px-2 transition-all ${
                  isActive ? "text-[#d4a454]" : "text-white/50"
                }`}
              >
                {isActive && (
                  <div className="absolute -top-0.5 left-0 right-0 h-1 bg-gradient-to-r from-[#d4a454] to-[#d4a454]/60 rounded-b-full" />
                )}
                <item.icon size={22} />
                <span className="text-[8px] font-bold tracking-wider uppercase leading-none text-center">
                  {item.name.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
