"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AdminLayout({ children }) {
  const admin = {
    name: "Administrator",
    email: "admin@aumnex.com",
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />

      <main className="ml-64 p-6">
        <Topbar student={admin} />
        {children}
      </main>
    </div>
  );
}