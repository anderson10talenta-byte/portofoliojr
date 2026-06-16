import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Globe2, Save, Search, UserRound } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { defaultSiteSettings, useSiteSettings, type SiteSettings } from "@/lib/siteSettings";

const groups = [
  { title: "Website content", icon: UserRound, fields: [["siteName", "Site name"], ["heroTitle", "Hero title"], ["heroSubtitle", "Hero subtitle"], ["aboutTitle", "About title"], ["aboutBody", "About description", "textarea"]] },
  { title: "Contact & social", icon: Globe2, fields: [["email", "Email"], ["phone", "Phone / WhatsApp"], ["location", "Location"], ["instagramUrl", "Instagram URL"], ["linkedinUrl", "LinkedIn URL"]] },
  { title: "Search engine optimization", icon: Search, fields: [["seoTitle", "SEO title"], ["seoDescription", "Meta description", "textarea"], ["seoKeywords", "Keywords"], ["canonicalUrl", "Canonical URL"], ["ogImageUrl", "Social share image URL"]] },
] as const;

export default function SiteSettingsPage() {
  const { data } = useSiteSettings(); const [form, setForm] = useState<SiteSettings>(defaultSiteSettings); const [saving, setSaving] = useState(false);
  const { toast } = useToast(); const queryClient = useQueryClient();
  useEffect(() => { if (data) setForm(data); }, [data]);
  const update = (key: keyof SiteSettings, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setSaving(true);
    try { const response = await fetch("/api/settings", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); if (!response.ok) throw new Error("Unable to save settings"); await queryClient.invalidateQueries({ queryKey: ["site-settings"] }); toast({ title: "Website settings saved" }); }
    catch (error) { toast({ title: "Save failed", description: error instanceof Error ? error.message : "Try again", variant: "destructive" }); }
    finally { setSaving(false); }
  };
  return <AdminLayout title="Website & SEO"><div className="mb-7 flex items-end justify-between gap-4"><div><h2 className="text-xl font-bold text-white">Website CMS</h2><p className="mt-1 text-sm text-muted-foreground">Update public copy, contact information, social links, and search metadata.</p></div><Button onClick={save} disabled={saving} className="rounded-md bg-primary font-bold text-black"><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Changes"}</Button></div><div className="space-y-6">{groups.map((group) => <section key={group.title} className="border border-border bg-card p-5 md:p-7"><div className="mb-6 flex items-center gap-3"><group.icon className="h-5 w-5 text-primary" /><h3 className="font-display text-xl font-bold text-white">{group.title}</h3></div><div className="grid gap-5 md:grid-cols-2">{group.fields.map(([key, label, kind]) => <label key={key} className={kind === "textarea" ? "md:col-span-2" : ""}><span className="mb-2 block text-sm font-medium text-white/75">{label}</span>{kind === "textarea" ? <Textarea value={form[key]} onChange={(event) => update(key, event.target.value)} className="min-h-24 rounded-md bg-background" /> : <Input value={form[key]} onChange={(event) => update(key, event.target.value)} className="h-11 rounded-md bg-background" />}</label>)}</div></section>)}</div></AdminLayout>;
}
