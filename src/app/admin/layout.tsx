import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-neutral-950 text-white">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* We add pt-16 on mobile to account for the fixed menu button */}
        <div className="p-6 pt-20 md:pt-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
