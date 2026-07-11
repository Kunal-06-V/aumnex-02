"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

import {
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react";

import SearchBar from "./SearchBar";

export default function Topbar({ student }) {

  const router = useRouter();
  const pathname = usePathname();

  const [showMenu, setShowMenu] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  async function handleLogout() {
    await signOut(auth);

    router.push(isAdmin ? "/" : "/");
  }

  function openProfile() {
    router.push(
      isAdmin
        ? "/admin/profile"
        : "/student/profile"
    );
  }

  function openSettings() {
    router.push(
      isAdmin
        ? "/admin/settings"
        : "/student/settings"
    );
  }

  function openHelp() {
    router.push(
      isAdmin
        ? "/admin/help"
        : "/student/help"
    );
  }

  function openNotifications() {
    router.push(
      isAdmin
        ? "/admin/notifications"
        : "/student/notifications"
    );
  }

  return (

    <div className="sticky top-0 z-40 bg-white rounded-2xl shadow-md px-6 py-4 mb-8 flex items-center justify-between">

      <div className="w-1/2">
        <SearchBar />
      </div>

      <div className="flex items-center gap-6">

        <div
          onClick={openNotifications}
          className="relative cursor-pointer"
        >

          <Bell
            size={24}
            className="text-gray-600 hover:text-blue-600"
          />

          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
            3
          </span>

        </div>

        <div className="relative">

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 hover:bg-gray-100 rounded-xl px-3 py-2 transition"
          >

            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              {student?.name?.charAt(0) || "A"}
            </div>

            <div className="text-left">

              <p className="font-semibold text-sm">
                {student?.name}
              </p>

              <p className="text-xs text-gray-500">
                {isAdmin ? "Administrator" : "Student"}
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
            />

          </button>

          {showMenu && (

            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border overflow-hidden z-50">              <button
                onClick={openProfile}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition"
              >
                👤 My Profile
              </button>

              <button
                onClick={openSettings}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition"
              >
                ⚙️ Settings
              </button>

              <button
                onClick={openHelp}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition"
              >
                ❓ Help
              </button>

              <hr />

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 flex items-center gap-2 transition"
              >
                <LogOut size={18} />
                Logout
              </button>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}