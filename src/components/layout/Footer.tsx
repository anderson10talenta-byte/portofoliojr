import { useCallback, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AdminLoginModal } from "@/components/admin/AdminLoginModal";
import { defaultSiteSettings, useSiteSettings } from "@/lib/siteSettings";

export function Footer() {
  const { data: settings = defaultSiteSettings } = useSiteSettings();
  const [adminOpen, setAdminOpen] = useState(false);
  const count = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secret = useCallback(() => {
    count.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { count.current = 0; }, 1200);
    if (count.current >= 3) { count.current = 0; setAdminOpen(true); }
  }, []);

  return (
    <footer className="bg-[#080a0a] px-6 pb-7 pt-10 md:px-12 lg:px-20">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 border-t border-white/8 pt-6 text-[11px] text-white/42 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={secret} className="text-left">© {new Date().getFullYear()} Richard Juan. All rights reserved.</button>
        <div className="flex items-center gap-8">{settings.instagramUrl && <a className="transition hover:text-white" href={settings.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}{settings.linkedinUrl && <a className="transition hover:text-white" href={settings.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>}<button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/16 text-white/64 transition hover:border-white/30 hover:text-white"><ArrowUp className="h-4 w-4" /></button></div>
      </div>
      <AdminLoginModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </footer>
  );
}
