import { useGetDashboardStats } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useEffect, useState } from "react";
import { FolderKanban, Video, Image as ImageIcon, Star, PenTool, Database, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaCard } from "@/components/ui/media-card";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const [integration, setIntegration] = useState<{ databaseConnected: boolean; storageConfigured: boolean; storageBucket: string; mode: string } | null>(null);

  useEffect(() => {
    fetch("/api/integrations/status", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then(setIntegration)
      .catch(() => setIntegration(null));
  }, []);

  return (
    <AdminLayout title="Overview">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-10 grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between border border-white/10 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm p-6 rounded-2xl hover:border-white/20 transition-all hover:bg-white/8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-white">Supabase Postgres</p>
                  <p className="text-sm text-white/50">Projects, media, and data</p>
                </div>
              </div>
              <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg ${integration?.databaseConnected ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{integration?.databaseConnected ? "Connected" : "Local mode"}</span>
            </div>
            
            <div className="flex items-center justify-between border border-white/10 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm p-6 rounded-2xl hover:border-white/20 transition-all hover:bg-white/8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400">
                  <HardDrive className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-white">Supabase Storage</p>
                  <p className="text-sm text-white/50">{integration?.storageBucket || "portfolio-uploads"}</p>
                </div>
              </div>
              <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg ${integration?.storageConfigured ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{integration?.storageConfigured ? "Connected" : "Local disk"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-12">
            <Card className="bg-gradient-to-br from-white/8 to-white/3 border-white/10 shadow-none hover:shadow-lg hover:shadow-white/10 transition-all hover:border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Projects</CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold text-white">{stats?.totalProjects || 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/8 to-white/3 border-white/10 shadow-none hover:shadow-lg hover:shadow-white/10 transition-all hover:border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Videos</CardTitle>
                <div className="p-2 rounded-lg bg-red-500/15 text-red-400">
                  <Video className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold text-white">{stats?.totalVideos || 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/8 to-white/3 border-white/10 shadow-none hover:shadow-lg hover:shadow-white/10 transition-all hover:border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Photos</CardTitle>
                <div className="p-2 rounded-lg bg-pink-500/15 text-pink-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold text-white">{stats?.totalPhotos || 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/8 to-white/3 border-white/10 shadow-none hover:shadow-lg hover:shadow-white/10 transition-all hover:border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Designs</CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400">
                  <PenTool className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold text-white">{stats?.totalDesigns || 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#d4a454]/20 to-[#d4a454]/5 border-[#d4a454]/30 shadow-none hover:shadow-lg hover:shadow-[#d4a454]/20 transition-all hover:border-[#d4a454]/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#d4a454]">Featured</CardTitle>
                <div className="p-2 rounded-lg bg-[#d4a454]/20 text-[#d4a454]">
                  <Star className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold text-[#d4a454]">{stats?.featuredProjects || 0}</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-6">Recently Uploaded</h2>
            
            {stats?.recentMedia && stats.recentMedia.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.recentMedia.map((media) => (
                  <MediaCard key={media.id} media={media} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-white/5 to-white/2 rounded-2xl border border-white/10">
                <p className="text-white/40 font-medium">No media uploaded yet. Get started by uploading your first video, photo, or design.</p>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
