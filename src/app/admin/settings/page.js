"use client";

import { useEffect, useState } from "react";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import {
  Settings,
  User,
  Mail,
  Bell,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Check,
  Database,
  Code2,
  ShieldCheck,
  Lock,
} from "lucide-react";

import toast from "react-hot-toast";

import { auth, db } from "@/lib/firebase";

import { useRouter } from "next/navigation";

import { useTheme } from "@/components/ThemeProvider";

export default function AdminSettings() {
  const router = useRouter();

  const { theme, changeTheme } = useTheme();

  const [admin, setAdmin] = useState(null);

  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          router.push("/");
          return;
        }

        try {
          /*
           * Load authenticated admin profile
           */
          const adminRef = doc(
            db,
            "admin",
            user.uid
          );

          const adminSnap = await getDoc(adminRef);

          if (adminSnap.exists()) {
            setAdmin(adminSnap.data());
          } else {
            /*
             * Fallback to Firebase Authentication
             * if admin profile doesn't exist.
             */
            setAdmin({
              name: user.displayName || "Administrator",
              email: user.email || "",
              role: "Administrator",
            });
          }

          /*
           * Load saved admin settings
           */
          const settingsRef = doc(
            db,
            "adminSettings",
            user.uid
          );

          const settingsSnap = await getDoc(
            settingsRef
          );

          if (settingsSnap.exists()) {
            const settings = settingsSnap.data();

            setEmailNotifications(
              settings.emailNotifications ?? true
            );
          }
        } catch (error) {
          console.error(
            "Failed to load admin settings:",
            error
          );

          toast.error(
            "Failed to load settings."
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [router]);

  async function handleSave() {
    const user = auth.currentUser;

    if (!user) {
      toast.error("You are not logged in.");
      return;
    }

    try {
      setSaving(true);

      await setDoc(
        doc(
          db,
          "adminSettings",
          user.uid
        ),
        {
          emailNotifications,
          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      );

      toast.success(
        "Settings saved successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save settings:",
        error
      );

      toast.error(
        "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);

      toast.success(
        "Logged out successfully."
      );

      router.push("/");
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to logout."
      );
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">

        <div className="h-10 w-64 bg-gray-200 rounded-xl animate-pulse" />

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-5">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* =====================================
          HEADER
      ====================================== */}

      <div>

        <div className="flex items-center gap-3">

          <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
            <Settings size={24} />
          </div>

          <div>

            <h1 className="text-3xl font-bold">
              Admin Settings
            </h1>

            <p className="text-gray-500 mt-1">
              Manage your administrator account
              and system preferences.
            </p>

          </div>

        </div>

      </div>


      {/* =====================================
          ADMIN PROFILE
      ====================================== */}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">

        <div className="flex flex-col md:flex-row md:items-center gap-6">

          <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">

            {admin?.name
              ?.charAt(0)
              ?.toUpperCase() || "A"}

          </div>

          <div>

            <h2 className="text-2xl font-bold">

              {admin?.name || "Administrator"}

            </h2>

            <p className="text-gray-500 mt-1">

              {admin?.email || "No email available"}

            </p>

            <span className="inline-block mt-3 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">

              {admin?.role || "Administrator"}

            </span>

          </div>

        </div>

      </div>


      {/* =====================================
          APPEARANCE
      ====================================== */}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">

        <div className="flex items-center gap-3 mb-6">

          <div className="p-3 rounded-xl bg-purple-100 text-purple-600">

            <Sun size={22} />

          </div>

          <div>

            <h2 className="text-xl font-semibold">
              Appearance
            </h2>

            <p className="text-sm text-gray-500">
              Customize the admin dashboard
              appearance.
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <ThemeCard
            title="Light"
            description="Bright and clean"
            icon={<Sun size={22} />}
            selected={theme === "light"}
            onClick={() =>
              changeTheme("light")
            }
          />

          <ThemeCard
            title="Dark"
            description="Easy on the eyes"
            icon={<Moon size={22} />}
            selected={theme === "dark"}
            onClick={() =>
              changeTheme("dark")
            }
          />

          <ThemeCard
            title="System"
            description="Follow device settings"
            icon={<Monitor size={22} />}
            selected={theme === "system"}
            onClick={() =>
              changeTheme("system")
            }
          />

        </div>

      </div>


      {/* =====================================
          NOTIFICATIONS
      ====================================== */}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">

        <div className="flex items-center gap-3 mb-6">

          <div className="p-3 rounded-xl bg-red-100 text-red-600">

            <Bell size={22} />

          </div>

          <div>

            <h2 className="text-xl font-semibold">
              Notifications
            </h2>

            <p className="text-sm text-gray-500">
              Manage administrator notification
              preferences.
            </p>

          </div>

        </div>

        <div className="flex items-center justify-between gap-6 border rounded-xl p-5">

          <div className="flex items-center gap-4">

            <div className="p-3 rounded-xl bg-gray-100">

              <Mail size={20} />

            </div>

            <div>

              <h3 className="font-semibold">
                Email Notifications
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Receive important system
                notifications by email.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setEmailNotifications(
                (previous) => !previous
              )
            }
            className={`relative w-14 h-7 rounded-full transition ${
              emailNotifications
                ? "bg-blue-600"
                : "bg-gray-300"
            }`}
          >

            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition ${
                emailNotifications
                  ? "left-8"
                  : "left-1"
              }`}
            />

          </button>

        </div>

      </div>


      {/* =====================================
          SECURITY
      ====================================== */}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">

        <div className="flex items-center gap-3 mb-6">

          <div className="p-3 rounded-xl bg-green-100 text-green-600">

            <ShieldCheck size={22} />

          </div>

          <div>

            <h2 className="text-xl font-semibold">
              Security
            </h2>

            <p className="text-sm text-gray-500">
              Manage your administrator account
              security.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="w-full md:w-auto flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 px-6 py-3 rounded-xl font-semibold transition"
        >

          <Lock size={18} />

          Change Password

        </button>

      </div>


      {/* =====================================
          SYSTEM INFORMATION
      ====================================== */}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">

        <div className="flex items-center gap-3 mb-6">

          <div className="p-3 rounded-xl bg-blue-100 text-blue-600">

            <Database size={22} />

          </div>

          <div>

            <h2 className="text-xl font-semibold">
              System Information
            </h2>

            <p className="text-sm text-gray-500">
              Information about the AUMNEX
              platform.
            </p>

          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-5">

          <InfoCard
            title="Project"
            value="Smart NFC Student ID ERP"
            icon={<Code2 size={18} />}
          />

          <InfoCard
            title="Version"
            value="v1.0.0"
            icon={<Settings size={18} />}
          />

          <InfoCard
            title="Database"
            value="Firebase Firestore"
            icon={<Database size={18} />}
          />

          <InfoCard
            title="Framework"
            value="Next.js + React"
            icon={<Code2 size={18} />}
          />

          <InfoCard
            title="Authentication"
            value="Firebase Authentication"
            icon={<Lock size={18} />}
          />

          <InfoCard
            title="Status"
            value="System Online"
            icon={<ShieldCheck size={18} />}
            success
          />

        </div>

      </div>


      {/* =====================================
          ACTIONS
      ====================================== */}

      <div className="flex flex-col sm:flex-row justify-end gap-4">

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl font-semibold transition"
        >

          <LogOut size={18} />

          Logout

        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition ${
            saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >

          <Settings size={18} />

          {saving
            ? "Saving..."
            : "Save Settings"}

        </button>

      </div>

    </div>
  );
}


/* =========================================
   THEME CARD
========================================= */

function ThemeCard({
  title,
  description,
  icon,
  selected,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
        selected
          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40"
          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md"
      }`}
    >

      {selected && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-1">
          <Check size={14} />
        </div>
      )}

      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
          selected
            ? "bg-blue-600 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
        }`}
      >
        {icon}
      </div>

      <h3 className="font-semibold text-lg">
        {title}
      </h3>

      <p className="text-sm text-gray-500 mt-1">
        {description}
      </p>

    </button>
  );
}


/* =========================================
   INFORMATION CARD
========================================= */

function InfoCard({
  title,
  value,
  icon,
  success = false,
}) {
  return (
    <div className="flex items-center gap-4 border rounded-xl p-5">

      <div className="p-3 rounded-xl bg-gray-100 text-gray-600">
        {icon}
      </div>

      <div>

        <p className="text-sm text-gray-500">
          {title}
        </p>

        <p
          className={`font-semibold mt-1 ${
            success
              ? "text-green-600"
              : ""
          }`}
        >
          {value}
        </p>

      </div>

    </div>
  );
}