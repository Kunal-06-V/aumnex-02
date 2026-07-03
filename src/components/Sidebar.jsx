import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Bell,
  User,
  ShieldAlert,
  Smartphone,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-blue-700 text-white p-6 overflow-y-auto z-50">
      <h1 className="fixed top-0 text-3xl font-bold bg-blue-700 mb-15">AUMNex</h1>

      <nav className="space-y-5 mt-10">
        <a href="#" className="flex items-center gap-3 hover:text-blue-200">
          <LayoutDashboard size={20} />
          Dashboard
        </a>

        <a href="#" className="flex items-center gap-3 hover:text-blue-200">
          <BookOpen size={20} />
          Academics
        </a>

        <a href="#" className="flex items-center gap-3 hover:text-blue-200">
          <CalendarDays size={20} />
          Attendance
        </a>

        <a href="#" className="flex items-center gap-3 hover:text-blue-200">
          <Smartphone size={20} />
          NFC Attendance
        </a>

        <a href="#" className="flex items-center gap-3 hover:text-blue-200">
          <Bell size={20} />
          Notifications
        </a>

        <a href="#" className="flex items-center gap-3 hover:text-blue-200">
          <User size={20} />
          Profile
        </a>

        <a href="#" className="flex items-center gap-3 hover:text-blue-200">
          <ShieldAlert size={20} />
          SOS
        </a>
      </nav>
    </aside>
  );
}