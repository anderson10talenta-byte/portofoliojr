import { AdminLayout } from "@/components/layout/AdminLayout";
import { MediaManager } from "@/components/admin/MediaManager";

export default function Photos() {
  return (
    <AdminLayout title="Photo Management">
      <MediaManager type="photo" />
    </AdminLayout>
  );
}
