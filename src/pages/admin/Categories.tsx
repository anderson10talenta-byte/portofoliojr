import { useState } from "react";
import { Plus, Trash2, Tags } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePortfolioCategories } from "@/lib/categories";

const categoryTypes = [
  { value: "all", label: "All media" },
  { value: "video", label: "Video only" },
  { value: "photo", label: "Photo only" },
  { value: "design", label: "Design only" },
];

export default function Categories() {
  const [name, setName] = useState("");
  const [type, setType] = useState("all");
  const [saving, setSaving] = useState(false);
  const { data: categories = [], isLoading } = usePortfolioCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portfolio-categories"] });

  const createCategory = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, type }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create category");
      setName("");
      setType("all");
      await refresh();
      toast({ title: "Portfolio category added" });
    } catch (error) {
      toast({ title: "Could not add category", description: String(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: number) => {
    const response = await fetch(`/api/categories/${id}`, { method: "DELETE", credentials: "include" });
    if (response.ok) {
      await refresh();
      toast({ title: "Portfolio category removed" });
    } else {
      toast({ title: "Could not remove category", variant: "destructive" });
    }
  };

  return (
    <AdminLayout title="Portfolio Categories">
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <section className="border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <Tags className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Add category</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">These categories become the filters in the public Portfolio section. They are separate from Projects.</p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-white/80">Category name</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Brand Film" className="bg-background" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/80">Available for</label>
              <select value={type} onChange={(event) => setType(event.target.value)} className="h-10 w-full border border-border bg-background px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
                {categoryTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <Button onClick={createCategory} disabled={saving || !name.trim()} className="w-full">
              <Plus className="mr-2 h-4 w-4" />{saving ? "Adding..." : "Add category"}
            </Button>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Current categories</h2>
              <p className="mt-1 text-sm text-muted-foreground">Assign these when uploading or editing media.</p>
            </div>
            <span className="text-xs text-muted-foreground">{categories.length} total</span>
          </div>
          <div className="divide-y divide-border border border-border bg-card">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Loading categories...</p>
            ) : categories.length ? categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-white">{category.name}</p>
                  <p className="mt-1 text-xs uppercase text-muted-foreground">{category.type === "all" ? "All media" : category.type}</p>
                </div>
                <button onClick={() => deleteCategory(category.id)} className="flex h-9 w-9 items-center justify-center text-destructive transition hover:bg-destructive/10" title="Delete category">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )) : (
              <p className="p-6 text-sm text-muted-foreground">No categories yet. Add Video, Photo, Brand Film, Commercial, Event, or any labels you need.</p>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
