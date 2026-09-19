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

export default function AdminLayout({
  children,
}) {
  const router = useRouter();

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

      <AdminSidebar />

      <main className="ml-64 p-6">

        <Topbar
          student={admin}
        />

        {children}

      </main>

    </div>
  );
}