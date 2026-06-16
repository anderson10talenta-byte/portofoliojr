import { useEffect } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Camera } from "lucide-react";
import { useListMedia } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

function updatePageMeta(opts: {
  title: string;
  description: string;
  canonical: string;
  image?: string;
}) {
  document.title = opts.title;

  const setMeta = (selector: string, attr: string, value: string) => {
    let el = document.querySelector<HTMLMetaElement>(selector);
    if (!el) {
      el = document.createElement("meta");
      const parts = selector.match(/\[([^\]]+)="([^"]+)"\]/);
      if (parts) el.setAttribute(parts[1], parts[2]);
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  };

  const setLink = (rel: string, href: string) => {
    let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
  };

  setMeta('meta[name="description"]', "content", opts.description);
  setLink("canonical", opts.canonical);
  setMeta('meta[property="og:title"]', "content", opts.title);
  setMeta('meta[property="og:description"]', "content", opts.description);
  setMeta('meta[property="og:url"]', "content", opts.canonical);
  setMeta('meta[property="og:type"]', "content", "article");
  if (opts.image) {
    setMeta('meta[property="og:image"]', "content", opts.image);
    setMeta('meta[name="twitter:image"]', "content", opts.image);
  }
  setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
  setMeta('meta[name="twitter:title"]', "content", opts.title);
  setMeta('meta[name="twitter:description"]', "content", opts.description);
}

function resetPageMeta() {
  document.title = "Richard Juan - Videographer & Photographer in Bandung";
  const descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (descEl) {
    descEl.content =
      "Richard Juan is a content-driven videographer and photographer based in Bandung, Indonesia.";
  }
  const canonEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonEl) canonEl.href = "https://richardjuan.com/";
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov|mkv|ogg)(\?|$)/i.test(url) || url.includes("/api/uploads/");
}

export default function WorkDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : null;
  const { data, isLoading } = useListMedia();
  const liveMedia = Array.isArray(data) ? data : [];
  const media = liveMedia;
  const item = id !== null ? media.find((entry) => entry.id === id) : undefined;

  useEffect(() => {
    if (!item) return;

    const siteUrl = "https://richardjuan.com";
    const canonical = `${siteUrl}/work/${item.id}`;
    const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    const title = `${item.title} - Richard Juan ${typeLabel}`;
    const description = item.description
      ? item.description.slice(0, 160)
      : `${typeLabel} by Richard Juan - Bandung videographer and photographer.${item.category ? ` Category: ${item.category}.` : ""}`;

    updatePageMeta({
      title,
      description,
      canonical,
      image: item.thumbnailUrl || undefined,
    });

    return () => resetPageMeta();
  }, [item]);

  const isVideo = item?.type === "video";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mb-8">
          <a
            href="/#work"
            className="inline-flex items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft size={16} />
            Back to portfolio
          </a>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-2/3 rounded-lg bg-card" />
            <div className="aspect-video rounded-lg bg-card" />
            <div className="h-4 w-full rounded bg-card" />
            <div className="h-4 w-3/4 rounded bg-card" />
          </div>
        ) : !item ? (
          <div className="rounded-lg border border-border/50 bg-card py-24 text-center">
            <Camera className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
            <h1 className="mb-2 font-display text-3xl font-bold text-white">Work not found</h1>
            <p className="mb-6 text-muted-foreground">
              This item may have been removed or the link is incorrect.
            </p>
            <a href="/" className="font-bold text-primary hover:underline">
              Back to homepage
            </a>
          </div>
        ) : (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                {item.type}
              </span>
              {item.category && (
                <span className="rounded-md border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/70">
                  {item.category}
                </span>
              )}
            </div>

            <h1 className="mb-6 font-display text-4xl font-black leading-tight text-white md:text-6xl">
              {item.title}
            </h1>

            <div className="mb-8 overflow-hidden rounded-lg bg-black">
              {isVideo ? (
                (() => {
                  const yt = getYouTubeEmbedUrl(item.url);
                  const direct = isDirectVideo(item.url);
                  return (
                    <div className="relative aspect-video w-full">
                      {yt && (
                        <iframe
                          src={yt}
                          className="absolute inset-0 h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={item.title}
                        />
                      )}
                      {!yt && direct && (
                        <video src={item.url} className="absolute inset-0 h-full w-full" controls />
                      )}
                      {!yt && !direct && (
                        <iframe
                          src={item.url}
                          className="absolute inset-0 h-full w-full"
                          allowFullScreen
                          title={item.title}
                        />
                      )}
                    </div>
                  );
                })()
              ) : (
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.title}
                  className="max-h-[70vh] w-full object-contain"
                />
              )}
            </div>

            {item.description && (
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                {item.description}
              </p>
            )}

            <div className="mt-12 border-t border-border/50 pt-8">
              <p className="text-sm text-muted-foreground">
                Work by{" "}
                <a href="/" className="font-semibold text-primary hover:underline">
                  Richard Juan
                </a>{" "}
                - Bandung Videographer & Photographer
              </p>
            </div>
          </motion.article>
        )}
      </main>

      <Footer />
    </div>
  );
}
