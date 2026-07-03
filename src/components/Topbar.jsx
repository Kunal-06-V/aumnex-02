"use client";


import { LogOut, Bell } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import SearchBar from "./SearchBar";

export default function Topbar({ student }) {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    router.push("/");
  }

return (
  <div className="sticky top-0 z-40 bg-white rounded-2xl shadow-md px-6 py-4 mb-8 flex items-center justify-between">

    {/* Left */}
    <div className="w-1/2">
      <SearchBar />
    </div>

    {/* Right */}
    <div className="flex items-center gap-6">

  {/* Notification */}
  <div className="relative cursor-pointer">
    <Bell
      size={24}
      className="text-gray-600 hover:text-blue-600"
    />

    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
      3
    </span>
  </div>

  {/* Student Profile */}
  <div className="flex items-center gap-3">

    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
      {student?.name?.charAt(0) || "S"}
    </div>

    <div>
      <p className="font-semibold text-sm">
        {student?.name}
      </p>

      <p className="text-xs text-gray-500">
        Student
      </p>
    </div>

  </div>

  {/* Logout */}
  <button
    onClick={handleLogout}
    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
  >
    <LogOut size={18} />
    Logout
  </button>

</div>

  </div>
);
}