"use client";

import { useEffect, useState } from "react";

import AdminSidebar from "@/components/AdminSidebar";
import Topbar from "@/components/Topbar";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function AdminLayout({
  children,
}) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] =
    useState(false);

  const admin = {
    name: "Administrator",
    email: "admin@aumnex.com",
  };

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

            return;
          }

          try {
            const adminRef = doc(
              db,
              "admin",
              "admin001"
            );

            const adminSnapshot =
              await getDoc(adminRef);

            if (!adminSnapshot.exists()) {
              if (active) {
                setAuthorized(false);
                setLoading(false);
              }

              return;
            }

            const adminData =
              adminSnapshot.data();

            const isAuthorized =
              adminData.uid ===
                currentUser.uid &&
              adminData.status ===
                "Active" &&
              (
                adminData.role ===
                  "Admin" ||
                adminData.role ===
                  "Super Admin"
              );

            if (active) {
              setAuthorized(
                isAuthorized
              );
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
          }
        }
      );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

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
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md">

          <h1 className="text-2xl font-bold text-red-600">
            Access Denied
          </h1>

          <p className="text-gray-500 mt-3">
            Administrator access is required
            to open this section.
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">

      <AdminSidebar />

      <main className="ml-64 p-6">

        <Topbar student={admin} />

        {children}

      </main>

    </div>
  );
}