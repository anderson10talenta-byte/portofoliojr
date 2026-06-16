import { AdminLayout } from "@/components/layout/AdminLayout";
import { MediaManager } from "@/components/admin/MediaManager";

export default function Designs() {
  return (
    <AdminLayout title="Design Work">
      <MediaManager type="design" />
    </AdminLayout>
  );
}
