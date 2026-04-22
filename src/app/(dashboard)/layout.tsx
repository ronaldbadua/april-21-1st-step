import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardUserBar } from "@/components/dashboard/dashboard-user-bar";

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full max-w-full bg-[#e8ebf0] text-slate-900">
      <Sidebar />
      <div className="min-w-0 flex-1 overflow-x-auto p-4 md:p-8">
        <div className="mx-auto w-full max-w-5xl">
          <DashboardUserBar />
          {children}
        </div>
      </div>
    </div>
  );
}
