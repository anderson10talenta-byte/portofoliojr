import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Loader2, Lock, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { setCachedAdminState } from "@/lib/adminAuth";

interface AdminLoginModalProps { open: boolean; onClose: () => void }

export function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setConfigured(null);
    fetch("/api/admin/status").then(async (res) => {
      const data = await res.json();
      setConfigured(Boolean(data.configured));
    }).catch(() => setConfigured(false));
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true);
    try {
      const endpoint = configured ? "/api/admin/login" : "/api/admin/setup";
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email, password }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to sign in");
      setCachedAdminState(true);
      onClose(); window.location.href = "/admin";
    } catch (error) {
      toast({ title: configured ? "Login failed" : "Setup failed", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] flex items-center justify-center bg-gradient-to-b from-black/70 via-black/80 to-black/90 p-4 backdrop-blur-xl" onClick={onClose}>
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-md border border-white/15 bg-gradient-to-br from-[#1a1d1d] via-[#0d1212] to-[#0a0d0d] p-8 shadow-2xl rounded-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
          {/* Gradient background effect */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#d4a454]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
          
          <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 p-2 text-white/40 hover:text-white transition-colors hover:bg-white/5 rounded-lg"><X size={20} /></button>
          
          <div className="relative space-y-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#d4a454]/30 bg-[#d4a454]/10 text-[#d4a454]">
              {configured ? <Lock size={24} /> : <KeyRound size={24} />}
            </div>
            
            <div>
              <h2 className="font-display text-3xl font-light text-white">{configured === false ? "Create admin account" : "Admin login"}</h2>
              <p className="mt-2 text-sm leading-6 text-white/50">{configured === false ? "First-time setup. Choose the email and password you will use for this CMS." : "Enter your email and password to manage the website."}</p>
            </div>

            {configured === null ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#d4a454]" size={32} />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <label className="group relative block">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/45 transition-colors group-focus-within:text-[#d4a454]" />
                    <Input 
                      type="email" 
                      placeholder="Email address" 
                      value={email} 
                      onChange={(event) => setEmail(event.target.value)} 
                      className="relative h-11 rounded-xl border-white/10 bg-white/5 pl-10 text-white backdrop-blur-sm transition-colors placeholder:text-white/30 focus:border-white/20 focus:bg-white/8" 
                      required 
                    />
                  </label>
                  
                  <label className="group relative block">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/45 transition-colors group-focus-within:text-[#d4a454]" />
                    <Input 
                      type="password" 
                      placeholder={configured ? "Password" : "Password (minimum 8 characters)"} 
                      value={password} 
                      onChange={(event) => setPassword(event.target.value)} 
                      className="relative h-11 rounded-xl border-white/10 bg-white/5 pl-10 text-white backdrop-blur-sm transition-colors placeholder:text-white/30 focus:border-white/20 focus:bg-white/8" 
                      minLength={8} 
                      required 
                    />
                  </label>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-[#d4a454] to-[#e3b66c] font-semibold text-black hover:shadow-xl hover:shadow-[#d4a454]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {configured ? "Sign In" : "Create Account & Continue"}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}
