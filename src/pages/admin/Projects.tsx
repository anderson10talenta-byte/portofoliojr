import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Check } from "lucide-react";
import { 
  useListProjects, useCreateProject, useUpdateProject, useDeleteProject,
  getListProjectsQueryKey, getGetDashboardStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  clientName: z.string().optional(),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  featured: z.boolean().default(false),
  showOnHomepage: z.boolean().default(false),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function Projects() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: projects, isLoading } = useListProjects();
  const { mutate: createProject, isPending: isCreating } = useCreateProject();
  const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
  const { mutate: deleteProject } = useDeleteProject();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { featured: false, showOnHomepage: false }
  });

  const featuredVal = watch("featured");
  const homeVal = watch("showOnHomepage");

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };

  const openCreate = () => {
    reset();
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEdit = (project: any) => {
    setEditingId(project.id);
    reset({
      title: project.title,
      category: project.category,
      clientName: project.clientName || "",
      description: project.description || "",
      thumbnailUrl: project.thumbnailUrl || "",
      featured: project.featured,
      showOnHomepage: project.showOnHomepage,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: ProjectFormValues) => {
    const payload = {
      ...data,
      thumbnailUrl: data.thumbnailUrl || null,
      tags: [], // Tags array handled separately if needed
    };

    if (editingId) {
      updateProject(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Project updated" });
            setIsDialogOpen(false);
            invalidateQueries();
          }
        }
      );
    } else {
      createProject(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "Project created" });
            setIsDialogOpen(false);
            invalidateQueries();
          }
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this project? Media items inside won't be deleted but will be detached.")) {
      deleteProject({ id }, {
        onSuccess: () => {
          toast({ title: "Project deleted" });
          invalidateQueries();
        }
      });
    }
  };

  return (
    <AdminLayout title="Project Portfolios">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl text-white font-bold">Manage Case Studies</h2>
          <p className="text-muted-foreground text-sm mt-1">Group media into full project case studies.</p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground font-bold">
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border/50">
              <TableHead>Project Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : projects?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              projects?.map((item) => (
                <TableRow key={item.id} className="border-border/50">
                  <TableCell>
                    <p className="font-bold text-white">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    </p>
                  </TableCell>
                  <TableCell>{item.clientName || "-"}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs rounded-md bg-white/10">{item.category}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {item.featured && <span className="text-[10px] uppercase font-bold text-primary border border-primary/30 px-2 py-0.5 rounded-sm">Featured</span>}
                      {item.showOnHomepage && <span className="text-[10px] uppercase font-bold text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded-sm">Home</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="hover:bg-white/10 text-white">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-destructive/20 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-white">
              {editingId ? `Edit Project` : `New Project`}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Project Title *</label>
              <Input {...register("title")} className="bg-background border-border" />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category *</label>
                <Input {...register("category")} className="bg-background border-border" placeholder="e.g., Commercial" />
                {errors.category && <p className="text-destructive text-xs mt-1">{errors.category.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Client Name</label>
                <Input {...register("clientName")} className="bg-background border-border" />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Thumbnail URL (Optional)</label>
              <Input {...register("thumbnailUrl")} className="bg-background border-border" placeholder="https://..." />
              {errors.thumbnailUrl && <p className="text-destructive text-xs mt-1">{errors.thumbnailUrl.message}</p>}
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea {...register("description")} className="bg-background border-border resize-none h-20" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-background p-3 rounded-xl border border-border">
                <div>
                  <label className="font-medium block text-white text-sm">Featured Project</label>
                </div>
                <Switch 
                  checked={featuredVal}
                  onCheckedChange={(val) => setValue("featured", val)}
                />
              </div>
              <div className="flex items-center justify-between bg-background p-3 rounded-xl border border-border">
                <div>
                  <label className="font-medium block text-white text-sm">Show on Homepage</label>
                </div>
                <Switch 
                  checked={homeVal}
                  onCheckedChange={(val) => setValue("showOnHomepage", val)}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating} className="bg-primary text-primary-foreground font-bold">
                {(isCreating || isUpdating) ? "Saving..." : <><Check className="mr-2 w-4 h-4"/> Save</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
