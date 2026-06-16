import { AdminLayout } from "@/components/layout/AdminLayout";
import { MediaManager } from "@/components/admin/MediaManager";

export default function Videos() {
  return (
    <AdminLayout title="Video Management">
      <MediaManager type="video" />
    </AdminLayout>
  );
}
