"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  onAuthStateChanged,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import {
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  LogOut,
  Lock,
  Pencil,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

import toast from "react-hot-toast";

import { auth, db } from "@/lib/firebase";
import PageHeader from "@/components/PageHeader";
import {
  Sun,
  Moon,
  Monitor,
  Check,
} from "lucide-react";

import { useTheme } from "@/components/ThemeProvider";

export default function StudentSettings() {
  
  const router = useRouter();
  const { theme, changeTheme } = useTheme();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  // ==========================================
  // LOAD LOGGED-IN STUDENT
  // ==========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          if (!user) {
            router.push("/");
            return;
          }

          const studentRef = doc(
            db,
            "students",
            user.uid
          );

          const studentSnap = await getDoc(studentRef);

          if (!studentSnap.exists()) {
            toast.error("Student profile not found.");
            return;
          }

          setStudent({
            id: studentSnap.id,
            ...studentSnap.data(),
            email: user.email || studentSnap.data().email,
          });
        } catch (error) {
          console.error(
            "Failed to load settings:",
            error
          );

          toast.error(
            "Failed to load account information."
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [router]);

  // ==========================================
  // LOGOUT
  // ==========================================

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await signOut(auth);

      toast.success("Logged out successfully.");

      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);

      toast.error("Failed to logout.");

      setLoggingOut(false);
    }
  }

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  async function handleChangePassword(e) {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Enter your current password.");
      return;
    }

    if (!newPassword) {
      toast.error("Enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error(
        "New password must contain at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      const user = auth.currentUser;

      if (!user || !user.email) {
        toast.error("Please login again.");
        return;
      }

      const credential =
        EmailAuthProvider.credential(
          user.email,
          currentPassword
        );

      await reauthenticateWithCredential(
        user,
        credential
      );

      await updatePassword(user, newPassword);

      toast.success(
        "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowPasswordForm(false);
    } catch (error) {
      console.error(
        "Password change error:",
        error
      );

      if (
        error.code ===
        "auth/invalid-credential"
      ) {
        toast.error(
          "Current password is incorrect."
        );
      } else if (
        error.code ===
        "auth/requires-recent-login"
      ) {
        toast.error(
          "Please login again before changing your password."
        );
      } else {
        toast.error(
          "Failed to change password."
        );
      }
    } finally {
      setChangingPassword(false);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="space-y-6">

        <PageHeader
          title="Settings"
          subtitle="Manage your account and preferences"
        />

        <div className="bg-white rounded-2xl shadow-lg p-8 animate-pulse">

          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />

          <div className="grid md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-20 bg-gray-200 rounded-xl"
              />
            ))}
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // PROFILE NOT FOUND
  // ==========================================

  if (!student) {
    return (
      <div className="space-y-6">

        <PageHeader
          title="Settings"
          subtitle="Manage your account and preferences"
        />

        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">

          <AlertCircle
            size={50}
            className="mx-auto text-yellow-500 mb-4"
          />

          <h2 className="text-2xl font-bold">
            Account information unavailable
          </h2>

          <p className="text-gray-500 mt-2">
            Your student profile could not be loaded.
          </p>

        </div>

      </div>
    );
  }

  const firstLetter =
    student.name?.charAt(0)?.toUpperCase() || "S";

  return (
    <div className="space-y-6">

      <PageHeader
        title="Settings"
        subtitle="Manage your account and security"
      />

      {/* =====================================
          ACCOUNT HEADER
      ====================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div className="flex items-center gap-5">

            <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">
              {firstLetter}
            </div>

            <div>

              <h2 className="text-2xl font-bold text-slate-800">
                {student.name || "Student"}
              </h2>

              <p className="text-gray-500">
                {student.email || "Email unavailable"}
              </p>

              <p className="text-sm text-gray-400 mt-1">
                {student.department || "Department"}{" "}
                •{" "}
                {student.semester || "Semester"}
              </p>

            </div>

          </div>

          <button
            onClick={() =>
              router.push("/student/profile/edit")
            }
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <Pencil size={18} />
            Edit Profile
          </button>

        </div>

      </div>

      {/* =====================================
          ACCOUNT INFORMATION
      ====================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex items-center gap-3 mb-6">

          <User
            size={24}
            className="text-blue-600"
          />

          <div>

            <h2 className="text-xl font-semibold">
              Account Information
            </h2>

            <p className="text-sm text-gray-500">
              Information associated with your account
            </p>

          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-5">

          <SettingItem
            icon={<Mail size={20} />}
            label="Email"
            value={student.email}
          />

          <SettingItem
            icon={<Phone size={20} />}
            label="Phone"
            value={student.phone || "Not Added"}
          />

          <SettingItem
            icon={<GraduationCap size={20} />}
            label="Department"
            value={
              student.department ||
              "Not Available"
            }
          />

          <SettingItem
            icon={<BookOpen size={20} />}
            label="Semester"
            value={
              student.semester ||
              "Not Available"
            }
          />

        </div>

      </div>
      {/* =====================================
    APPEARANCE
====================================== */}

<div className="bg-white rounded-2xl shadow-lg p-8">

  <div className="flex items-center gap-3 mb-6">

    <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
      <Sun size={22} />
    </div>

    <div>
      <h2 className="text-xl font-semibold">
        Appearance
      </h2>

      <p className="text-sm text-gray-500">
        Customize how AUMNEX looks on your device
      </p>
    </div>

  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

    <ThemeCard
      title="Light"
      description="Bright and clean"
      icon={<Sun size={22} />}
      selected={theme === "light"}
      onClick={() => changeTheme("light")}
    />

    <ThemeCard
      title="Dark"
      description="Easy on the eyes"
      icon={<Moon size={22} />}
      selected={theme === "dark"}
      onClick={() => changeTheme("dark")}
    />

    <ThemeCard
      title="System"
      description="Follow device settings"
      icon={<Monitor size={22} />}
      selected={theme === "system"}
      onClick={() => changeTheme("system")}
    />

  </div>

</div>

      {/* =====================================
          SECURITY
      ====================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex items-center gap-3 mb-6">

          <ShieldCheck
            size={24}
            className="text-green-600"
          />

          <div>

            <h2 className="text-xl font-semibold">
              Security
            </h2>

            <p className="text-sm text-gray-500">
              Manage your account security
            </p>

          </div>

        </div>

        {!showPasswordForm ? (

          <button
            onClick={() =>
              setShowPasswordForm(true)
            }
            className="flex items-center gap-3 w-full md:w-auto px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition"
          >
            <Lock size={18} />

            <span className="font-medium">
              Change Password
            </span>
          </button>

        ) : (

          <form
            onSubmit={handleChangePassword}
            className="space-y-5 max-w-xl"
          >

            <PasswordInput
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              visible={showCurrentPassword}
              setVisible={
                setShowCurrentPassword
              }
            />

            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              visible={showNewPassword}
              setVisible={setShowNewPassword}
            />

            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showConfirmPassword}
              setVisible={
                setShowConfirmPassword
              }
            />

            <div className="flex gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowPasswordForm(false)
                }
                disabled={changingPassword}
                className="px-5 py-3 rounded-xl border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={changingPassword}
                className={`px-5 py-3 rounded-xl text-white ${
                  changingPassword
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {changingPassword
                  ? "Changing..."
                  : "Change Password"}
              </button>

            </div>

          </form>

        )}

      </div>

      {/* =====================================
          SESSION
      ====================================== */}

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex items-center gap-3 mb-5">

          <LogOut
            size={24}
            className="text-red-600"
          />

          <div>

            <h2 className="text-xl font-semibold">
              Session
            </h2>

            <p className="text-sm text-gray-500">
              Sign out of your account
            </p>

          </div>

        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={`flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 rounded-xl text-white ${
            loggingOut
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          <LogOut size={18} />

          {loggingOut
            ? "Logging out..."
            : "Logout"}
        </button>

      </div>

    </div>
  );
}

// ==========================================
// REUSABLE SETTING ITEM
// ==========================================

function SettingItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">

      <div className="text-blue-600">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-sm text-gray-500">
          {label}
        </p>

        <p className="font-semibold text-slate-800 truncate">
          {value || "Not Available"}
        </p>

      </div>

    </div>
  );
}

// ==========================================
// PASSWORD INPUT
// ==========================================

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  setVisible,
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="relative">

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="w-full border border-gray-300 rounded-xl p-3 pr-12 outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <button
          type="button"
          onClick={() =>
            setVisible(!visible)
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {visible ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
        </button>

      </div>

    </div>
  );
}
 


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
          : "border-gray-200 hover:border-blue-300 hover:shadow-md"
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
            : "bg-gray-100 text-gray-600"
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