import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { AdminLoginModal } from "@/components/admin/AdminLoginModal";

const links = [
  ["Work", "#work"],
  ["Services", "#services"],
  ["About", "#about"],
  ["Process", "#process"],
  ["Contact", "#contact"],
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const logoClicks = useRef(0);
  const logoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = useCallback(() => {
    logoClicks.current += 1;
    if (logoTimer.current) clearTimeout(logoTimer.current);
    logoTimer.current = setTimeout(() => { logoClicks.current = 0; }, 900);
    if (logoClicks.current >= 3) {
      logoClicks.current = 0;
      setAdminOpen(true);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    if (window.location.pathname !== "/") {
      window.location.href = `/${href}`;
      return;
    }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[#080a0a]/78 px-6 py-4 backdrop-blur-xl md:px-12 lg:px-20">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <button onClick={handleLogoClick} className="font-display text-lg font-semibold tracking-wide text-white md:text-xl">RICHARD JUAN</button>
          <nav className="hidden items-center gap-2 md:flex">
            {links.map(([label, href]) => <button key={href} onClick={() => go(href)} className="rounded-full px-4 py-2 text-xs text-white/56 transition hover:text-white">{label}</button>)}
            <button onClick={() => go("#contact")} className="ml-2 rounded-full border border-white/18 px-5 py-2.5 text-xs font-medium text-white/76 transition hover:border-white/35 hover:text-white">Start a Project</button>
          </nav>
          <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white md:hidden">{open ? <X /> : <Menu />}</button>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-[#090d0d]/98 md:hidden">
            {links.map(([label, href]) => <button key={href} onClick={() => go(href)} className="font-display text-3xl text-white">{label}</button>)}
            <button onClick={() => go("#contact")} className="mt-4 rounded-full border border-[#d4a454] px-7 py-4 text-sm text-[#d4a454]">Start a Project</button>
          </motion.nav>
        )}
      </AnimatePresence>
      <AdminLoginModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </>
  );
}
