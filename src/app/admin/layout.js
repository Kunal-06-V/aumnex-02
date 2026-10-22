"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminSidebar from "@/components/AdminSidebar";
import Topbar from "@/components/Topbar";

import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { Menu } from "lucide-react";

export default function AdminLayout({
  children,
}) {
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [authorized, setAuthorized] =
    useState(false);

  const [admin, setAdmin] =
    useState({
      name: "Administrator",
      email: "admin@aumnex.com",
    });

  useEffect(() => {
    let active = true;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!currentUser) {
            if (active) {
              setAuthorized(false);
              setLoading(false);
            }

            router.replace("/");
            return;
          }

          try {
            /*
             * Find the administrator record
             * belonging to the authenticated
             * Firebase user.
             */
            const adminQuery =
              query(
                collection(
                  db,
                  "admin"
                ),
                where(
                  "uid",
                  "==",
                  currentUser.uid
                )
              );

            const adminSnapshot =
              await getDocs(
                adminQuery
              );

            if (
              adminSnapshot.empty
            ) {
              if (active) {
                setAuthorized(false);
                setLoading(false);
              }

              router.replace("/");
              return;
            }

            const adminData =
              adminSnapshot.docs[0].data();

            const role =
              String(
                adminData.role || ""
              ).trim();

            const status =
              String(
                adminData.status || ""
              ).trim();

            const isAuthorized =
              adminData.uid ===
              currentUser.uid &&
              status === "Active" &&
              (
                role === "Admin" ||
                role === "Super Admin"
              );

            if (!isAuthorized) {
              if (active) {
                setAuthorized(false);
                setLoading(false);
              }

              router.replace("/");
              return;
            }

            if (active) {
              setAdmin({
                name:
                  adminData.name ||
                  "Administrator",

                email:
                  adminData.email ||
                  currentUser.email ||
                  "admin@aumnex.com",
              });

              setAuthorized(true);
              setLoading(false);
            }
          } catch (error) {
            console.error(
              "Admin authorization error:",
              error
            );

            if (active) {
              setAuthorized(false);
              setLoading(false);
            }

            router.replace("/");
          }
        }
      );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg px-8 py-6 text-center">

          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-gray-600 font-medium">
            Verifying administrator access...
          </p>

        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">

     {mobileSidebarOpen && (
  <button
    type="button"
    aria-label="Close navigation menu"
    onClick={() => setMobileSidebarOpen(false)}
    className="fixed inset-0 z-40 bg-black/50 md:hidden"
  />
)}

<AdminSidebar
  mobileOpen={mobileSidebarOpen}
  onNavigate={() => setMobileSidebarOpen(false)}
/>

      <main className="ml-0 min-w-0 p-3 md:ml-64 md:p-6">

        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="mb-3 flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-white md:hidden"
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>

        <Topbar
          student={admin}
        />

        {children}

      </main>

    </div>
  );
}