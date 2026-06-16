import { useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Edit2, Trash2, Link as LinkIcon, Star, Check,
  Upload, Link2, Image as ImageIcon, Video, X,
  Clapperboard, Camera as CameraCapture, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, Images, Layers,
} from "lucide-react";
import {
  useListMedia, useCreateMedia, useUpdateMedia, useDeleteMedia,
  useListProjects,
  getListMediaQueryKey, getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usePortfolioCategories } from "@/lib/categories";

const MAX_GALLERY_IMAGES = 6;

const urlSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  category: z.string().optional(),
  featured: z.boolean().default(false),
  projectId: z.number().nullable().optional(),
});

type UrlFormValues = z.infer<typeof urlSchema>;

interface MediaManagerProps {
  type: "video" | "photo" | "design";
}

type Tab = "upload" | "url";

/* ── GalleryGrid ──────────────────────────────────────────────── */
function GalleryGrid({
  images,
  onDelete,
  onMoveUp,
  onMoveDown,
  uploading,
}: {
  images: string[];
  onDelete: (i: number) => void;
  onMoveUp: (i: number) => void;
  onMoveDown: (i: number) => void;
  uploading?: boolean;
}) {
  if (images.length === 0 && !uploading) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Gallery ({images.length} / {MAX_GALLERY_IMAGES})
        </span>
        <div className="flex items-center gap-1 text-xs text-primary/70">
          <Images size={11} /> First = cover
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => (
          <div key={src + i} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square bg-black/40">
            <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />

            {/* Cover badge */}
            {i === 0 && (
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-primary text-black text-[9px] font-black uppercase tracking-wide">
                Cover
              </div>
            )}

            {/* Actions overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button
                onClick={() => onMoveUp(i)}
                disabled={i === 0}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-20 flex items-center justify-center transition-colors"
                title="Move left"
              >
                <ArrowUp size={12} className="text-white" />
              </button>
              <button
                onClick={() => onDelete(i)}
                className="w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors"
                title="Remove"
              >
                <X size={12} className="text-white" />
              </button>
              <button
                onClick={() => onMoveDown(i)}
                disabled={i === images.length - 1}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-20 flex items-center justify-center transition-colors"
                title="Move right"
              >
                <ArrowDown size={12} className="text-white" />
              </button>
            </div>
          </div>
        ))}

        {/* Uploading slot */}
        {uploading && (
          <div className="rounded-xl border border-dashed border-primary/40 aspect-square bg-primary/5 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── GalleryUrlManager (for URL / edit tab) ──────────────────── */
function GalleryUrlManager({
  images,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAdd,
}: {
  images: string[];
  onDelete: (i: number) => void;
  onMoveUp: (i: number) => void;
  onMoveDown: (i: number) => void;
  onAdd: (url: string) => void;
}) {
  const [newUrl, setNewUrl] = useState("");
  const handleAdd = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    try { new URL(trimmed); } catch { return; }
    onAdd(trimmed);
    setNewUrl("");
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium block text-white/80">
        Gallery Images <span className="text-white/40">(optional, max {MAX_GALLERY_IMAGES})</span>
      </label>

      {images.length > 0 && (
        <div className="flex flex-col gap-2">
          {images.map((src, i) => (
            <div key={src + i} className="flex items-center gap-2 bg-background/60 rounded-lg px-2 py-1.5 border border-border/50">
              <img src={src} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-black/40" onError={e => { (e.target as HTMLImageElement).src = ""; }} />
              <span className="flex-1 text-xs text-white/60 truncate">{src}</span>
              {i === 0 && <span className="text-[9px] font-black text-primary uppercase px-1.5 py-0.5 rounded bg-primary/10">Cover</span>}
              <div className="flex gap-1">
                <button onClick={() => onMoveUp(i)} disabled={i === 0} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center">
                  <ArrowUp size={11} className="text-white" />
                </button>
                <button onClick={() => onMoveDown(i)} disabled={i === images.length - 1} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center">
                  <ArrowDown size={11} className="text-white" />
                </button>
                <button onClick={() => onDelete(i)} className="w-6 h-6 rounded bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center">
                  <X size={11} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length < MAX_GALLERY_IMAGES && (
        <div className="flex gap-2">
          <Input
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAdd())}
            placeholder="Paste image URL to add..."
            className="bg-background border-border text-sm flex-1"
          />
          <Button type="button" size="sm" variant="outline" onClick={handleAdd} className="border-border hover:bg-white/5 shrink-0">
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Main MediaManager ───────────────────────────────────────── */
export function MediaManager({ type }: MediaManagerProps) {
  const isGalleryType = type === "photo" || type === "design";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [isDragging, setIsDragging] = useState(false);

  // Single upload (video)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  // Thumbnail upload (video)
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState<string>("");
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);

  // Gallery upload (photo/design)
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  // Bulk upload
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  type BulkStatus = "pending" | "uploading" | "done" | "error";
  const [bulkItems, setBulkItems] = useState<Array<{ file: File; title: string; previewUrl: string; status: BulkStatus }>>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkProgressIdx, setBulkProgressIdx] = useState(-1);
  const [isDraggingBulk, setIsDraggingBulk] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFeatured, setUploadFeatured] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameVideoRef = useRef<HTMLVideoElement>(null);
  const [isCapturingFrame, setIsCapturingFrame] = useState(false);
  const [showFrameCapture, setShowFrameCapture] = useState(false);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string>("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: mediaList, isLoading } = useListMedia({ type });
  const { mutate: createMedia, mutateAsync: createMediaAsync, isPending: isCreating } = useCreateMedia();
  const { mutate: updateMedia, isPending: isUpdating } = useUpdateMedia();
  const { mutate: deleteMedia } = useDeleteMedia();
  const { data: projects } = useListProjects();
  const { data: portfolioCategories = [] } = usePortfolioCategories();
  const applicableCategories = portfolioCategories.filter((category) => category.type === "all" || category.type === type);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: { featured: false },
  });

  const featuredVal = watch("featured");
  const urlVal = watch("url") || "";

  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const isDirectVideoUrl = (url: string): boolean => {
    return /\.(mp4|webm|mov|mkv|ogg)(\?.*)?$/i.test(url) || url.includes("/api/uploads/");
  };

  const captureVideoFrame = async () => {
    const video = frameVideoRef.current;
    if (!video) return;
    setIsCapturingFrame(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const previewDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedPreviewUrl(previewDataUrl);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Canvas conversion failed")), "image/jpeg", 0.9)
      );
      const formData = new FormData();
      formData.append("file", blob, "thumbnail.jpg");
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setValue("thumbnailUrl", data.url);
      toast({ title: "Thumbnail captured and saved!" });
    } catch (err) {
      toast({ title: "Failed to capture frame", description: String(err), variant: "destructive" });
    } finally {
      setIsCapturingFrame(false);
    }
  };

  const ytId = extractYouTubeId(urlVal);
  const isDirectVideo = isDirectVideoUrl(urlVal);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListMediaQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };

  const resetFrameCapture = () => {
    setShowFrameCapture(false);
    setCapturedPreviewUrl("");
  };

  const resetUploadState = () => {
    setUploadedFileUrl("");
    setUploadedFileName("");
    setUploadedThumbnailUrl("");
    setGalleryUrls([]);
    setUploadTitle("");
    setUploadCategory("");
    setUploadDescription("");
    setUploadFeatured(false);
    setUploadProjectId(null);
  };

  const openCreate = () => {
    reset();
    setEditingId(null);
    resetUploadState();
    setActiveTab("upload");
    resetFrameCapture();
    setIsDialogOpen(true);
  };

  const openEdit = (media: any) => {
    setEditingId(media.id);
    reset({
      title: media.title,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl || "",
      description: media.description || "",
      category: media.category || "",
      featured: media.featured,
      projectId: media.projectId ?? null,
    });
    setGalleryUrls(media.galleryUrls || []);
    setUploadedThumbnailUrl("");
    setActiveTab("url");
    resetFrameCapture();
    setIsDialogOpen(true);
  };

  const MAX_UPLOAD_MB = 100;
  const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

  const uploadFile = useCallback(async (file: File, isGalleryItem = false): Promise<string | null> => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
        description: `Max upload size is ${MAX_UPLOAD_MB}MB.`,
        variant: "destructive",
      });
      return null;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Upload failed");
      }
      const data = await res.json();
      return data.url as string;
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  /* ── Thumbnail image upload (video) ── */
  const uploadThumbnailFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Only image files can be used as thumbnails", variant: "destructive" });
      return;
    }
    setIsThumbnailUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Upload failed");
      }
      const data = await res.json();
      setUploadedThumbnailUrl(data.url as string);
      // Also populate the URL-tab thumbnailUrl field for edits
      setValue("thumbnailUrl", data.url);
      toast({ title: "Thumbnail uploaded" });
    } catch (err: any) {
      toast({ title: "Thumbnail upload failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsThumbnailUploading(false);
    }
  }, [toast, setValue]);

  /* ── Single file upload (video) ── */
  const handleSingleFileDrop = useCallback(async (file: File) => {
    const url = await uploadFile(file);
    if (url) {
      setUploadedFileUrl(url);
      setUploadedFileName(file.name);
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
      toast({ title: "File uploaded successfully" });
    }
  }, [uploadFile, uploadTitle, toast]);

  /* ── Multi file upload (photo/design) ── */
  const handleGalleryFileDrop = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    const available = MAX_GALLERY_IMAGES - galleryUrls.length;
    if (available <= 0) {
      toast({ title: `Gallery is full (max ${MAX_GALLERY_IMAGES} images)`, variant: "destructive" });
      return;
    }
    const toUpload = fileArr.slice(0, available);
    if (fileArr.length > available) {
      toast({ title: `Added ${available} of ${fileArr.length} images (gallery full)` });
    }
    for (const file of toUpload) {
      const url = await uploadFile(file, true);
      if (url) {
        setGalleryUrls(prev => {
          const next = [...prev, url];
          if (!uploadTitle && next.length === 1) setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
          return next;
        });
      }
    }
    if (toUpload.every(f => f.size <= MAX_UPLOAD_BYTES)) {
      toast({ title: `${toUpload.length} image${toUpload.length > 1 ? "s" : ""} uploaded` });
    }
  }, [uploadFile, galleryUrls.length, uploadTitle, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isGalleryType) {
      handleGalleryFileDrop(e.dataTransfer.files);
    } else {
      const file = e.dataTransfer.files[0];
      if (file) handleSingleFileDrop(file);
    }
  }, [isGalleryType, handleGalleryFileDrop, handleSingleFileDrop]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (isGalleryType) {
      handleGalleryFileDrop(e.target.files);
    } else {
      const file = e.target.files[0];
      if (file) handleSingleFileDrop(file);
    }
    e.target.value = "";
  }, [isGalleryType, handleGalleryFileDrop, handleSingleFileDrop]);

  /* ── Gallery management helpers ── */
  const deleteGalleryImage = (i: number) => setGalleryUrls(prev => prev.filter((_, idx) => idx !== i));
  const moveGalleryUp = (i: number) => setGalleryUrls(prev => {
    if (i === 0) return prev;
    const next = [...prev];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    return next;
  });
  const moveGalleryDown = (i: number) => setGalleryUrls(prev => {
    if (i === prev.length - 1) return prev;
    const next = [...prev];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    return next;
  });

  /* ── Submit handlers ── */
  const handleUploadSubmit = () => {
    const coverUrl = isGalleryType ? galleryUrls[0] : uploadedFileUrl;
    if (!coverUrl) {
      toast({ title: `Please upload ${isGalleryType ? "at least one image" : "a file"} first`, variant: "destructive" });
      return;
    }
    if (!uploadTitle.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    createMedia(
      {
        data: {
          title: uploadTitle,
          url: coverUrl,
          thumbnailUrl: isGalleryType ? (uploadedThumbnailUrl || coverUrl) : (uploadedThumbnailUrl || undefined),
          galleryUrls: isGalleryType ? galleryUrls : [],
          type,
          category: uploadCategory || undefined,
          description: uploadDescription || undefined,
          featured: uploadFeatured,
          projectId: uploadProjectId ?? undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Added successfully" });
          setIsDialogOpen(false);
          invalidateQueries();
        },
        onError: (err: any) => {
          toast({ title: "Failed to save", description: err?.message || "Please try again.", variant: "destructive" });
        },
      },
    );
  };

  const onUrlSubmit = (data: UrlFormValues) => {
    const payload = {
      ...data,
      type,
      thumbnailUrl: data.thumbnailUrl || null,
      galleryUrls,
      projectId: data.projectId ?? undefined,
    };
    const onError = (err: any) => {
      toast({ title: "Failed to save", description: err?.message || "Please try again.", variant: "destructive" });
    };
    if (editingId) {
      updateMedia(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Updated successfully" });
            setIsDialogOpen(false);
            invalidateQueries();
          },
          onError,
        },
      );
    } else {
      createMedia(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "Created successfully" });
            setIsDialogOpen(false);
            invalidateQueries();
          },
          onError,
        },
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMedia(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Deleted successfully" });
            invalidateQueries();
          },
        },
      );
    }
  };

  const toggleFeatured = (id: number, current: boolean) => {
    updateMedia({ id, data: { featured: !current } }, { onSuccess: () => invalidateQueries() });
  };

  /* ── Bulk upload handlers ── */
  const addBulkItems = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f =>
      type === "video" ? f.type.startsWith("video/") : f.type.startsWith("image/")
    );
    const items = arr.map(f => ({
      file: f,
      title: f.name.replace(/\.[^.]+$/, ""),
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : "",
      status: "pending" as const,
    }));
    setBulkItems(prev => [...prev, ...items]);
  }, [type]);

  const removeBulkItem = (i: number) => {
    setBulkItems(prev => {
      const copy = [...prev];
      if (copy[i].previewUrl) URL.revokeObjectURL(copy[i].previewUrl);
      copy.splice(i, 1);
      return copy;
    });
  };

  const updateBulkTitle = (i: number, title: string) => {
    setBulkItems(prev => prev.map((item, idx) => idx === i ? { ...item, title } : item));
  };

  const handleBulkSubmit = async () => {
    const pending = bulkItems.filter(it => it.status === "pending");
    if (pending.length === 0) return;
    setIsBulkUploading(true);
    let successCount = 0;
    for (let i = 0; i < bulkItems.length; i++) {
      if (bulkItems[i].status !== "pending") continue;
      setBulkProgressIdx(i);
      setBulkItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: "uploading" } : item));
      const { file, title } = bulkItems[i];
      let url: string | null = null;
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        url = data.url as string;
      } catch {
        setBulkItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: "error" } : item));
        continue;
      }
      try {
        await createMediaAsync({
          data: {
            title: title || file.name,
            url,
            type,
            thumbnailUrl: isGalleryType ? url : undefined,
            galleryUrls: isGalleryType ? [url] : [],
          },
        });
        setBulkItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: "done" } : item));
        successCount++;
      } catch {
        setBulkItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: "error" } : item));
      }
    }
    setIsBulkUploading(false);
    setBulkProgressIdx(-1);
    invalidateQueries();
    const allDone = successCount === pending.length;
    toast({
      title: allDone
        ? `${successCount} ${type}${successCount !== 1 ? "s" : ""} uploaded`
        : `${successCount} of ${pending.length} uploaded — some failed`,
      variant: allDone ? "default" : "destructive",
    });
    if (allDone) {
      setBulkItems([]);
      setIsBulkDialogOpen(false);
    }
  };

  const titleText = type === "video" ? "Videos" : type === "photo" ? "Photos" : "Designs";
  const hasUpload = isGalleryType ? galleryUrls.length > 0 : !!uploadedFileUrl;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl text-white font-bold">Manage {titleText}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setBulkItems([]); setIsBulkDialogOpen(true); }}
            className="border-border text-white/70 hover:bg-white/5 font-semibold"
          >
            <Layers className="mr-2 h-4 w-4" /> Bulk Upload
          </Button>
          <Button onClick={openCreate} className="bg-primary text-primary-foreground font-bold">
            <Plus className="mr-2 h-4 w-4" /> Add {type === "video" ? "Video" : type === "photo" ? "Photo" : "Design"}
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border/50">
              <TableHead>Preview</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Featured</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : mediaList?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No {titleText.toLowerCase()} found. Add your first one!
                </TableCell>
              </TableRow>
            ) : (
              mediaList?.map((item) => (
                <TableRow key={item.id} className="border-border/50 group">
                  <TableCell>
                    <div className="relative w-24 h-16 rounded-md overflow-hidden bg-black/50 border border-white/10 flex items-center justify-center">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : item.type === "video" ? (
                        <Video className="text-primary w-6 h-6" />
                      ) : (
                        <ImageIcon className="text-primary w-6 h-6" />
                      )}
                      {(item.galleryUrls?.length ?? 0) > 1 && (
                        <div className="absolute bottom-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                          <Images size={9} /> {item.galleryUrls.length}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-white line-clamp-1">{item.title}</p>
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center mt-1">
                      <LinkIcon className="w-3 h-3 mr-1" /> Source
                    </a>
                  </TableCell>
                  <TableCell>
                    {item.category && (
                      <span className="px-2 py-1 text-xs rounded-md bg-white/10">{item.category}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => toggleFeatured(item.id, item.featured)}
                      className={`p-2 rounded-full transition-colors mx-auto flex items-center justify-center ${
                        item.featured ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-white/5"
                      }`}
                    >
                      <Star className={`w-5 h-5 ${item.featured ? "fill-current" : ""}`} />
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(item.createdAt), "MMM d, yyyy")}
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
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[560px] flex flex-col max-h-[90vh] p-0 gap-0 overflow-hidden">
          {/* Fixed Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
            <DialogTitle className="text-xl font-display text-white">
              {editingId ? `Edit ${type}` : `Add New ${type}`}
            </DialogTitle>

            {!editingId && (
              <div className="flex rounded-xl border border-border overflow-hidden mt-4">
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                    activeTab === "upload" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <Upload size={15} /> Upload File
                </button>
                <button
                  onClick={() => setActiveTab("url")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                    activeTab === "url" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <Link2 size={15} /> Paste URL
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1 px-6 py-4">
            {(activeTab === "upload" && !editingId) ? (
              <div className="space-y-4">

                {/* ── Gallery drop zone (photo/design) ── */}
                {isGalleryType ? (
                  <>
                    {galleryUrls.length < MAX_GALLERY_IMAGES && (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                          isDragging ? "border-primary bg-primary/10" : "border-white/20 hover:border-primary/50 hover:bg-white/5"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                        />
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
                              <Images className="text-primary" size={22} />
                            </div>
                            <p className="text-white font-semibold text-sm text-center">Drop images here</p>
                            <p className="text-muted-foreground text-xs mt-1 text-center">or click to browse · select multiple</p>
                            <p className="text-xs text-muted-foreground/50 mt-1">JPG, PNG, WebP · max {MAX_UPLOAD_MB}MB each · up to {MAX_GALLERY_IMAGES} images</p>
                          </>
                        )}
                      </div>
                    )}

                    <GalleryGrid
                      images={galleryUrls}
                      onDelete={deleteGalleryImage}
                      onMoveUp={moveGalleryUp}
                      onMoveDown={moveGalleryDown}
                      uploading={isUploading && galleryUrls.length < MAX_GALLERY_IMAGES}
                    />

                    {/* ── Card Thumbnail (photo/design) ── */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium block text-white/80">
                        Card Thumbnail <span className="text-white/40">(optional)</span>
                      </label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed -mt-1">
                        Upload a custom 16:9 cover image for the portfolio grid. If not set, the first gallery image is used.
                      </p>
                      {uploadedThumbnailUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-primary/40 bg-black/40">
                          <img src={uploadedThumbnailUrl} alt="Thumbnail preview" className="w-full aspect-video object-cover" />
                          <button
                            type="button"
                            onClick={() => setUploadedThumbnailUrl("")}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-red-500/80 flex items-center justify-center transition-colors"
                          >
                            <X size={13} className="text-white" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 px-3 py-2">
                            <p className="text-[10px] text-primary font-bold uppercase tracking-wide">Card thumbnail set</p>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingThumbnail(true); }}
                          onDragLeave={() => setIsDraggingThumbnail(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingThumbnail(false);
                            const file = e.dataTransfer.files[0];
                            if (file) uploadThumbnailFile(file);
                          }}
                          onClick={() => thumbnailFileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 ${
                            isDraggingThumbnail ? "border-primary bg-primary/10" : "border-white/15 hover:border-primary/40 hover:bg-white/5"
                          }`}
                        >
                          <input
                            ref={thumbnailFileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadThumbnailFile(file);
                              e.target.value = "";
                            }}
                          />
                          {isThumbnailUploading ? (
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <ImageIcon size={20} className="text-white/30" />
                              <p className="text-xs text-white/60 text-center">
                                Drop thumbnail here or <span className="text-primary">click to upload</span>
                              </p>
                              <p className="text-[10px] text-white/30">JPG, PNG, WebP · ideally 16:9</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* ── Single drop zone (video) ── */
                  <>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        isDragging ? "border-primary bg-primary/10" : "border-white/20 hover:border-primary/50 hover:bg-white/5"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="video/*"
                        onChange={handleFileChange}
                      />
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                      ) : uploadedFileUrl ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="text-green-400" size={24} />
                          </div>
                          <p className="text-sm font-medium text-white text-center break-all">{uploadedFileName}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); setUploadedFileUrl(""); setUploadedFileName(""); }}
                            className="text-xs text-destructive hover:underline flex items-center gap-1 mt-1"
                          >
                            <X size={12} /> Remove & re-upload
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                            <Upload className="text-primary" size={26} />
                          </div>
                          <p className="text-white font-semibold text-center">Drop your video here</p>
                          <p className="text-muted-foreground text-sm mt-1 text-center">or click to browse from your gallery</p>
                          <p className="text-xs text-muted-foreground/60 mt-2">MP4, MOV, WebM · max {MAX_UPLOAD_MB}MB</p>
                          <p className="text-xs text-primary/70 mt-1 text-center">
                            Larger videos? Use "Paste URL" to embed from YouTube
                          </p>
                        </>
                      )}
                    </div>

                    {/* ── Thumbnail upload (video only) ── */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium block text-white/80">
                        Thumbnail <span className="text-white/40">(optional)</span>
                      </label>
                      {uploadedThumbnailUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-primary/40 bg-black/40">
                          <img src={uploadedThumbnailUrl} alt="Thumbnail preview" className="w-full aspect-video object-cover" />
                          <button
                            type="button"
                            onClick={() => setUploadedThumbnailUrl("")}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-red-500/80 flex items-center justify-center transition-colors"
                          >
                            <X size={13} className="text-white" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 px-3 py-2">
                            <p className="text-[10px] text-primary font-bold uppercase tracking-wide">Thumbnail set</p>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingThumbnail(true); }}
                          onDragLeave={() => setIsDraggingThumbnail(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingThumbnail(false);
                            const file = e.dataTransfer.files[0];
                            if (file) uploadThumbnailFile(file);
                          }}
                          onClick={() => thumbnailFileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 ${
                            isDraggingThumbnail ? "border-primary bg-primary/10" : "border-white/15 hover:border-primary/40 hover:bg-white/5"
                          }`}
                        >
                          <input
                            ref={thumbnailFileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadThumbnailFile(file);
                              e.target.value = "";
                            }}
                          />
                          {isThumbnailUploading ? (
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <ImageIcon size={20} className="text-white/30" />
                              <p className="text-xs text-white/60 text-center">Drop thumbnail here or <span className="text-primary">click to upload</span></p>
                              <p className="text-[10px] text-white/30">JPG, PNG, WebP</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm font-medium mb-1.5 block text-white/80">Title <span className="text-primary">*</span></label>
                  <Input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="bg-background border-border"
                    placeholder="Give it a title..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-white/80">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="h-10 w-full border border-border bg-background px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">No category</option>
                    {applicableCategories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                  </select>
                  <p className="mt-1.5 text-xs text-white/35">Manage options from Portfolio Categories.</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-white/80">Description</label>
                  <Textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="bg-background border-border resize-none h-20"
                  />
                </div>
                <div className="flex items-center justify-between bg-background p-4 rounded-xl border border-border">
                  <div>
                    <label className="font-medium block text-white text-sm">Feature on Home Page</label>
                    <p className="text-xs text-muted-foreground mt-0.5">Shown in the selected works section.</p>
                  </div>
                  <Switch checked={uploadFeatured} onCheckedChange={setUploadFeatured} />
                </div>
                {projects && projects.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-white/80">Project <span className="text-white/40">(optional)</span></label>
                    <select
                      value={uploadProjectId ?? ""}
                      onChange={(e) => setUploadProjectId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-lg bg-background border border-border text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">No project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              /* ── URL / Edit tab ── */
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-white/80">Title <span className="text-primary">*</span></label>
                  <Input {...register("title")} className="bg-background border-border" placeholder="e.g., Brand Campaign 2024" />
                  {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-white/80">
                    {isGalleryType ? "Cover Image URL" : "URL"} <span className="text-primary">*</span>
                  </label>
                  <Input
                    {...register("url")}
                    className="bg-background border-border"
                    placeholder={isGalleryType ? "https://... (cover / main image)" : "https://youtube.com/watch?v=..."}
                  />
                  {errors.url && <p className="text-destructive text-xs mt-1">{errors.url.message}</p>}
                  {!isGalleryType && <p className="text-xs text-muted-foreground mt-1">YouTube or any direct video link</p>}
                </div>

                {/* Gallery for photo/design */}
                {isGalleryType && (
                  <GalleryUrlManager
                    images={galleryUrls}
                    onDelete={deleteGalleryImage}
                    onMoveUp={moveGalleryUp}
                    onMoveDown={moveGalleryDown}
                    onAdd={(url) => setGalleryUrls(prev => [...prev, url])}
                  />
                )}

                {!isGalleryType && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium block text-white/80">
                      Thumbnail <span className="text-white/40">(optional)</span>
                    </label>
                    {/* URL input */}
                    <Input {...register("thumbnailUrl")} className="bg-background border-border" placeholder="https://... or upload below" />
                    {errors.thumbnailUrl && <p className="text-destructive text-xs mt-1">{errors.thumbnailUrl.message}</p>}
                    {/* Upload alternative */}
                    {uploadedThumbnailUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-primary/40 bg-black/40">
                        <img src={uploadedThumbnailUrl} alt="Thumbnail preview" className="w-full aspect-video object-cover" />
                        <button
                          type="button"
                          onClick={() => { setUploadedThumbnailUrl(""); setValue("thumbnailUrl", ""); }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-red-500/80 flex items-center justify-center transition-colors"
                        >
                          <X size={13} className="text-white" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 px-3 py-2">
                          <p className="text-[10px] text-primary font-bold uppercase tracking-wide">Uploaded thumbnail</p>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingThumbnail(true); }}
                        onDragLeave={() => setIsDraggingThumbnail(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingThumbnail(false);
                          const file = e.dataTransfer.files[0];
                          if (file) uploadThumbnailFile(file);
                        }}
                        onClick={() => thumbnailFileInputRef.current?.click()}
                        className={`border border-dashed rounded-xl px-4 py-3 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                          isDraggingThumbnail ? "border-primary bg-primary/10" : "border-white/15 hover:border-primary/40 hover:bg-white/5"
                        }`}
                      >
                        <input
                          ref={thumbnailFileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadThumbnailFile(file);
                            e.target.value = "";
                          }}
                        />
                        {isThumbnailUploading ? (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Upload size={15} className="text-white/30 shrink-0" />
                            <p className="text-xs text-white/50">Drop image or <span className="text-primary">click to upload</span> thumbnail · JPG, PNG, WebP</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Frame capture (video only) */}
                {type === "video" && urlVal && (ytId || isDirectVideo) && (
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowFrameCapture(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-background/60 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Clapperboard size={15} className="text-primary" />
                        {ytId ? "Auto-detect YouTube Thumbnail" : "Capture Frame as Thumbnail"}
                      </div>
                      <span className="text-xs text-muted-foreground">{showFrameCapture ? "Hide" : "Show"}</span>
                    </button>

                    {showFrameCapture && (
                      <div className="p-4 bg-background/40 space-y-3">
                        {ytId && (
                          <>
                            <p className="text-xs text-muted-foreground">Choose a quality level for the auto-generated thumbnail:</p>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: "Max Res", key: "maxresdefault" },
                                { label: "High", key: "hqdefault" },
                                { label: "Standard", key: "sddefault" },
                              ].map(({ label, key }) => {
                                const thumbUrl = `https://img.youtube.com/vi/${ytId}/${key}.jpg`;
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => setValue("thumbnailUrl", thumbUrl)}
                                    className="group relative rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                                  >
                                    <img src={thumbUrl} alt={label} className="w-full aspect-video object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <span className="text-xs font-bold text-white">Use {label}</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center py-1">
                                      <span className="text-[10px] text-white/70">{label}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}

                        {isDirectVideo && (
                          <>
                            <p className="text-xs text-muted-foreground">Scrub to the frame you want, then capture it:</p>
                            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                              <video
                                ref={frameVideoRef}
                                src={urlVal}
                                className="w-full h-full object-contain"
                                crossOrigin="anonymous"
                                preload="metadata"
                                onLoadedMetadata={(e) => { e.currentTarget.currentTime = 0; }}
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => { if (frameVideoRef.current) frameVideoRef.current.currentTime = Math.max(0, frameVideoRef.current.currentTime - 5); }}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                              >
                                <ChevronLeft size={14} />
                              </button>
                              <input
                                type="range" min="0" max="100" defaultValue="0"
                                className="flex-1 accent-yellow-400"
                                onChange={(e) => {
                                  const video = frameVideoRef.current;
                                  if (!video || !video.duration) return;
                                  video.currentTime = (Number(e.target.value) / 100) * video.duration;
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => { if (frameVideoRef.current) frameVideoRef.current.currentTime = Math.min(frameVideoRef.current.duration || 0, frameVideoRef.current.currentTime + 5); }}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                              >
                                <ChevronRight size={14} />
                              </button>
                            </div>
                            {capturedPreviewUrl && (
                              <div className="rounded-lg overflow-hidden border border-primary/40">
                                <p className="text-[10px] text-primary font-bold px-2 pt-2">Captured Frame Preview</p>
                                <img src={capturedPreviewUrl} alt="Captured frame" className="w-full aspect-video object-cover" />
                              </div>
                            )}
                            <Button
                              type="button" size="sm" onClick={captureVideoFrame} disabled={isCapturingFrame}
                              className="w-full bg-primary text-black font-bold"
                            >
                              <CameraCapture size={14} className="mr-2" />
                              {isCapturingFrame ? "Capturing..." : "Capture This Frame as Thumbnail"}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1.5 block text-white/80">Category</label>
                  <select {...register("category")} className="h-10 w-full border border-border bg-background px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">No category</option>
                    {applicableCategories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                  </select>
                  <p className="mt-1.5 text-xs text-white/35">Manage options from Portfolio Categories.</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-white/80">Description</label>
                  <Textarea {...register("description")} className="bg-background border-border resize-none h-20" />
                </div>
                <div className="flex items-center justify-between bg-background p-4 rounded-xl border border-border">
                  <div>
                    <label className="font-medium block text-white text-sm">Feature on Home Page</label>
                    <p className="text-xs text-muted-foreground mt-0.5">Shown in the selected works section.</p>
                  </div>
                  <Switch checked={featuredVal} onCheckedChange={(val) => setValue("featured", val)} />
                </div>
                {projects && projects.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-white/80">Project <span className="text-white/40">(optional)</span></label>
                    <select
                      value={watch("projectId") ?? ""}
                      onChange={(e) => setValue("projectId", e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-lg bg-background border border-border text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">No project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t border-border/50 bg-card shrink-0 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-border hover:bg-white/5"
            >
              Cancel
            </Button>

            {(activeTab === "upload" && !editingId) ? (
              <Button
                type="button"
                onClick={handleUploadSubmit}
                disabled={isCreating || isUploading || !hasUpload}
                className="bg-primary text-black font-bold px-6"
              >
                {isCreating ? (
                  <><div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin mr-2" /> Saving...</>
                ) : (
                  <><Check className="mr-2 w-4 h-4" /> Save</>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit(onUrlSubmit)}
                disabled={isCreating || isUpdating}
                className="bg-primary text-black font-bold px-6"
              >
                {(isCreating || isUpdating) ? (
                  <><div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin mr-2" /> Saving...</>
                ) : (
                  <><Check className="mr-2 w-4 h-4" /> Save</>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Upload Dialog ── */}
      <Dialog
        open={isBulkDialogOpen}
        onOpenChange={(open) => {
          if (!isBulkUploading) {
            setIsBulkDialogOpen(open);
            if (!open) setBulkItems([]);
          }
        }}
      >
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[640px] flex flex-col max-h-[90vh] p-0 gap-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
            <DialogTitle className="text-xl font-display text-white">
              Bulk Upload {titleText}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Each file is saved as a separate {type} in your portfolio
            </p>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {/* Drop zone — hidden while uploading */}
            {!isBulkUploading && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingBulk(true); }}
                onDragLeave={() => setIsDraggingBulk(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingBulk(false);
                  addBulkItems(e.dataTransfer.files);
                }}
                onClick={() => bulkFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDraggingBulk ? "border-primary bg-primary/10" : "border-white/20 hover:border-primary/50 hover:bg-white/5"
                }`}
              >
                <input
                  ref={bulkFileInputRef}
                  type="file"
                  className="hidden"
                  accept={type === "video" ? "video/*" : "image/*"}
                  multiple
                  onChange={(e) => {
                    if (e.target.files) addBulkItems(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                  <Layers className="text-primary" size={26} />
                </div>
                <p className="text-white font-semibold text-center">
                  Drop {type === "video" ? "videos" : "images"} here
                </p>
                <p className="text-muted-foreground text-sm mt-1 text-center">
                  or click to browse · select multiple files
                </p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  {type === "video" ? "MP4, MOV, WebM" : "JPG, PNG, WebP"} · max {MAX_UPLOAD_MB}MB each
                </p>
              </div>
            )}

            {/* File list */}
            {bulkItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {bulkItems.length} file{bulkItems.length !== 1 ? "s" : ""} selected
                  </span>
                  {!isBulkUploading && (
                    <button
                      onClick={() => {
                        bulkItems.forEach(it => { if (it.previewUrl) URL.revokeObjectURL(it.previewUrl); });
                        setBulkItems([]);
                      }}
                      className="text-xs text-destructive hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {bulkItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-background/60 rounded-xl px-3 py-2.5 border border-border/50">
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0 bg-black/40"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                        <Video size={20} className="text-primary/60" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {item.status === "pending" ? (
                        <Input
                          value={item.title}
                          onChange={(e) => updateBulkTitle(i, e.target.value)}
                          className="bg-background border-border text-sm h-8 px-2"
                          placeholder="Title..."
                        />
                      ) : (
                        <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.file.name}</p>
                    </div>

                    <div className="shrink-0">
                      {item.status === "pending" && !isBulkUploading && (
                        <button
                          onClick={() => removeBulkItem(i)}
                          className="w-7 h-7 rounded-full hover:bg-red-500/20 flex items-center justify-center transition-colors"
                        >
                          <X size={14} className="text-red-400" />
                        </button>
                      )}
                      {item.status === "uploading" && (
                        <div className="w-7 h-7 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {item.status === "done" && (
                        <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check size={14} className="text-green-400" />
                        </div>
                      )}
                      {item.status === "error" && (
                        <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center" title="Failed">
                          <X size={14} className="text-red-400" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {bulkItems.length === 0 && !isBulkUploading && (
              <p className="text-center text-sm text-muted-foreground py-2">No files added yet.</p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border/50 bg-card shrink-0 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (!isBulkUploading) {
                  setBulkItems([]);
                  setIsBulkDialogOpen(false);
                }
              }}
              disabled={isBulkUploading}
              className="border-border hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkSubmit}
              disabled={
                isBulkUploading ||
                bulkItems.filter(it => it.status === "pending").length === 0
              }
              className="bg-primary text-black font-bold px-6"
            >
              {isBulkUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin mr-2" />
                  Uploading {bulkProgressIdx + 1} / {bulkItems.length}...
                </>
              ) : (
                <>
                  <Check className="mr-2 w-4 h-4" />
                  Upload {bulkItems.filter(it => it.status === "pending").length} {type}
                  {bulkItems.filter(it => it.status === "pending").length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
