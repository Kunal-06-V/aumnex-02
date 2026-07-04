"use client";


import { LogOut, Bell } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import SearchBar from "./SearchBar";

export default function Topbar({ student }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

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
    <div className="relative">

  <button
    onClick={() => setShowMenu(!showMenu)}
    className="flex items-center gap-3 hover:bg-gray-100 rounded-xl px-3 py-2 transition"
  >
    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
      {student?.name?.charAt(0) || "S"}
    </div>

    <div className="text-left">
      <p className="font-semibold text-sm">
        {student?.name}
      </p>

      <p className="text-xs text-gray-500">
        Student
      </p>
      <p className="text-xs text-gray-400">
        {student?.email}
      </p>
    </div>

<ChevronDown
  size={18}
  className={`transition-transform ${
    showMenu ? "rotate-180" : ""
  }`}
/>  </button>

  {showMenu && (
    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border overflow-hidden z-50">

      <button
         onClick={() => router.push("/student/profile")}
          className="w-full text-left px-4 py-3 hover:bg-gray-100">
         👤 My Profile
     </button>

      <button className="w-full text-left px-4 py-3 hover:bg-gray-100">
        ⚙️ Settings
      </button>

      <button className="w-full text-left px-4 py-3 hover:bg-gray-100">
        ❓ Help
      </button>

      <button
        onClick={handleLogout}
        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50"
      >
        🚪 Logout
      </button>

    </div>
  )}

</div>

</div>

  </div>
);
}