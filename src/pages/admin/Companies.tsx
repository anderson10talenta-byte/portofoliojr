import { useState, type ChangeEvent, type DragEvent } from "react";
import { Building2, Edit2, ImageUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCompanies, type Company } from "@/lib/companies";

const emptyForm = { name: "", logoUrl: "", websiteUrl: "", sortOrder: "0", active: true };

export default function Companies() {
  const { data: companies = [], isLoading } = useCompanies(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["companies"] });
  const create = () => { setEditingId(null); setForm(emptyForm); setOpen(true); };
  const edit = (company: Company) => {
    setEditingId(company.id);
    setForm({ name: company.name, logoUrl: company.logoUrl, websiteUrl: company.websiteUrl || "", sortOrder: String(company.sortOrder), active: company.active });
    setOpen(true);
  };

  const uploadLogo = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Logo must be an image", variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: "Logo is larger than 2 MB", description: "Compress the image before uploading.", variant: "destructive" }); return; }
    setUploading(true);
    try {
      const data = new FormData(); data.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", credentials: "include", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");
      setForm((current) => ({ ...current, logoUrl: result.url }));
    } catch (error) {
      toast({ title: "Logo upload failed", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.logoUrl.trim()) { toast({ title: "Company name and logo are required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/companies/${editingId}` : "/api/companies", {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) || 0 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save company");
      await refresh(); setOpen(false); toast({ title: editingId ? "Company updated" : "Company added" });
    } catch (error) {
      toast({ title: "Save failed", description: error instanceof Error ? error.message : "Try again", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (company: Company) => {
    if (!window.confirm(`Delete ${company.name}?`)) return;
    const response = await fetch(`/api/companies/${company.id}`, { method: "DELETE", credentials: "include" });
    if (response.ok) { await refresh(); toast({ title: "Company deleted" }); }
    else toast({ title: "Delete failed", variant: "destructive" });
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => uploadLogo(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); uploadLogo(event.dataTransfer.files?.[0]); };

  return (
    <AdminLayout title="Companies">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-xl font-bold text-white">Company Logo Slider</h2><p className="mt-1 text-sm text-muted-foreground">Manage companies and clients displayed on the public homepage.</p></div>
        <Button onClick={create} className="bg-primary font-bold text-black"><Plus className="mr-2 h-4 w-4" />Add Company</Button>
      </div>

      <div className="mb-6 border border-[#75b7bb]/25 bg-[#75b7bb]/5 p-5">
        <div className="flex gap-3"><ImageUp className="mt-0.5 h-5 w-5 shrink-0 text-[#75b7bb]" /><div><h3 className="text-sm font-semibold text-white">Recommended logo file</h3><p className="mt-1 text-sm leading-6 text-white/55">Use a transparent PNG or WebP at <strong className="text-white/80">800 x 400 px</strong> (2:1 ratio), with the logo centered and generous empty space. Keep the file below <strong className="text-white/80">2 MB</strong>. Horizontal logos produce the best result.</p></div></div>
      </div>

      {isLoading ? <div className="py-16 text-center text-muted-foreground">Loading companies...</div> : companies.length === 0 ? (
        <div className="border border-border bg-card py-16 text-center"><Building2 className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No companies have been added.</p></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {companies.map((company) => <article key={company.id} className="flex items-center gap-4 border border-border bg-card p-4">
            <div className="flex h-20 w-32 shrink-0 items-center justify-center bg-white p-3"><img src={company.logoUrl} alt={company.name} className="max-h-full max-w-full object-contain" /></div>
            <div className="min-w-0 flex-1"><h3 className="truncate font-semibold text-white">{company.name}</h3><p className="mt-1 text-xs text-muted-foreground">Order {company.sortOrder} · {company.active ? "Visible" : "Hidden"}</p>{company.websiteUrl && <p className="mt-1 truncate text-xs text-[#75b7bb]">{company.websiteUrl}</p>}</div>
            <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => edit(company)}><Edit2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => remove(company)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></div>
          </article>)}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="border-border bg-card text-foreground sm:max-w-xl"><DialogHeader><DialogTitle>{editingId ? "Edit Company" : "Add Company"}</DialogTitle></DialogHeader>
        <div className="space-y-5 pt-3">
          <label className="block"><span className="mb-2 block text-sm font-medium">Company name *</span><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="bg-background" /></label>
          <label onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="flex min-h-36 cursor-pointer flex-col items-center justify-center border border-dashed border-white/20 bg-background p-5 text-center transition hover:border-[#75b7bb]"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} className="sr-only" />{uploading ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : <ImageUp className="h-7 w-7 text-[#75b7bb]" />}<span className="mt-3 text-sm font-medium text-white">Drop logo here or click to upload</span><span className="mt-1 text-xs text-muted-foreground">PNG, JPG, or WebP · maximum 2 MB</span></label>
          {form.logoUrl && <div className="flex h-28 items-center justify-center bg-white p-4"><img src={form.logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" /></div>}
          <label className="block"><span className="mb-2 block text-sm font-medium">Logo URL *</span><Input value={form.logoUrl} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} placeholder="https://..." className="bg-background" /></label>
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]"><label><span className="mb-2 block text-sm font-medium">Website URL</span><Input value={form.websiteUrl} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} placeholder="https://..." className="bg-background" /></label><label><span className="mb-2 block text-sm font-medium">Display order</span><Input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} className="bg-background" /></label></div>
          <div className="flex items-center justify-between border border-border bg-background p-4"><div><p className="text-sm font-medium text-white">Show on homepage</p><p className="mt-1 text-xs text-muted-foreground">Hidden companies remain saved in the CMS.</p></div><Switch checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={saving || uploading} className="bg-primary font-bold text-black">{saving ? "Saving..." : "Save Company"}</Button></DialogFooter>
      </DialogContent></Dialog>
    </AdminLayout>
  );
}
