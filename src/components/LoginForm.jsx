"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  Eye,
  EyeOff,
  GraduationCap,
  Shield,
  Mail,
  LockKeyhole,
  Phone,
  User,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import { useStudent } from "@/context/StudentContext";

export default function LoginForm() {
  const router = useRouter();
  const { setStudent } = useStudent();

  // ============================================================
  // FORM STATE
  // ============================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [isRegister, setIsRegister] =
    useState(false);

  // Role is selected ONLY during registration.
  const [registerRole, setRegisterRole] =
    useState("student");

  // ============================================================
  // LOGIN
  // ============================================================

  async function handleLogin(event) {
    event.preventDefault();

    if (loading) return;

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      toast.error(
        "Please enter your email and password."
      );
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------------------
      // FIREBASE AUTH
      // --------------------------------------------------------

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user =
        userCredential.user;

      // --------------------------------------------------------
      // FIRST: CHECK CENTRAL USER PROFILE
      // --------------------------------------------------------

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnap =
        await getDoc(userRef);

      if (userSnap.exists()) {
        const userData =
          userSnap.data();

        // ======================================================
        // REGISTERED AS ADMIN
        // ======================================================

        if (userData.role === "admin") {
          const adminRef = doc(
            db,
            "admin",
            user.uid
          );

          const adminSnap =
            await getDoc(adminRef);

          if (!adminSnap.exists()) {
            await signOut(auth);

            toast.error(
              "Administrator profile is incomplete."
            );

            return;
          }

          const adminData =
            adminSnap.data();

          const validAdminRole =
            adminData.role === "Admin" ||
            adminData.role === "Super Admin";

          if (!validAdminRole) {
            await signOut(auth);

            toast.error(
              "Invalid administrator role."
            );

            return;
          }

          if (
            adminData.status !== "Active"
          ) {
            await signOut(auth);

            toast.error(
              "Your administrator account is still pending approval."
            );

            return;
          }

          toast.success(
            `Welcome ${adminData.name || "Administrator"}!`
          );

          router.replace(
            "/admin/dashboard"
          );

          return;
        }

        // ======================================================
        // REGISTERED AS STUDENT
        // ======================================================

        if (userData.role === "student") {
          const studentRef = doc(
            db,
            "students",
            user.uid
          );

          const studentSnap =
            await getDoc(studentRef);

          if (!studentSnap.exists()) {
            await signOut(auth);

            toast.error(
              "Student profile is incomplete."
            );

            return;
          }

          const studentData =
            studentSnap.data();

          if (
            studentData.status === "Pending"
          ) {
            await signOut(auth);

            toast.error(
              "Your student account is awaiting administrator approval."
            );

            return;
          }

          if (
            studentData.status !== "Active"
          ) {
            await signOut(auth);

            toast.error(
              "Your student account is not active."
            );

            return;
          }

          if (
            studentData.role !== "student"
          ) {
            await signOut(auth);

            toast.error(
              "Invalid student role."
            );

            return;
          }

          setStudent({
            uid: user.uid,
            ...studentData,
          });

          toast.success(
            `Welcome ${studentData.name || "Student"}!`
          );

          router.replace(
            "/student/dashboard"
          );

          return;
        }
      }

      // --------------------------------------------------------
      // LEGACY / EXISTING ADMIN FALLBACK
      // --------------------------------------------------------

      const adminQuery = query(
        collection(db, "admin"),
        where("uid", "==", user.uid)
      );

      const adminSnapshot =
        await getDocs(adminQuery);

      if (!adminSnapshot.empty) {
        const adminData =
          adminSnapshot.docs[0].data();

        if (
          (adminData.role === "Admin" ||
            adminData.role === "Super Admin") &&
          adminData.status === "Active"
        ) {
          toast.success(
            `Welcome ${adminData.name || "Administrator"}!`
          );

          router.replace(
            "/admin/dashboard"
          );

          return;
        }

        await signOut(auth);

        toast.error(
          "Your administrator account is not active."
        );

        return;
      }

      // --------------------------------------------------------
      // LEGACY / EXISTING STUDENT FALLBACK
      // --------------------------------------------------------

      const studentRef = doc(
        db,
        "students",
        user.uid
      );

      const studentSnap =
        await getDoc(studentRef);

      if (studentSnap.exists()) {
        const studentData =
          studentSnap.data();

        if (
          studentData.status === "Pending"
        ) {
          await signOut(auth);

          toast.error(
            "Your student account is awaiting administrator approval."
          );

          return;
        }

        if (
          studentData.status !== "Active"
        ) {
          await signOut(auth);

          toast.error(
            "Your student account is not active."
          );

          return;
        }

        if (
          studentData.role &&
          studentData.role !== "student"
        ) {
          await signOut(auth);

          toast.error(
            "Invalid student role."
          );

          return;
        }

        setStudent({
          uid: user.uid,
          ...studentData,
        });

        toast.success(
          `Welcome ${studentData.name || "Student"}!`
        );

        router.replace(
          "/student/dashboard"
        );

        return;
      }

      // --------------------------------------------------------
      // NO PROFILE
      // --------------------------------------------------------

      await signOut(auth);

      toast.error(
        "No AUMNex profile is linked to this account."
      );
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      switch (error?.code) {
        case "auth/invalid-credential":
          toast.error(
            "Invalid email or password."
          );
          break;

        case "auth/user-not-found":
          toast.error(
            "User account not found."
          );
          break;

        case "auth/wrong-password":
          toast.error(
            "Incorrect password."
          );
          break;

        case "auth/invalid-email":
          toast.error(
            "Please enter a valid email address."
          );
          break;

        case "auth/too-many-requests":
          toast.error(
            "Too many attempts. Please try again later."
          );
          break;

        case "auth/network-request-failed":
          toast.error(
            "Network error. Check your connection."
          );
          break;

        case "auth/operation-not-allowed":
          toast.error(
            "Email/password authentication is disabled."
          );
          break;

        default:
          toast.error(
            "Login failed. Please try again."
          );
      }
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // REGISTER
  // ============================================================

  async function handleRegister() {
    if (loading) return;

    const cleanName =
      fullName.trim();

    const cleanPhone =
      phone.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanName) {
      toast.error(
        "Please enter your full name."
      );
      return;
    }

    if (!cleanPhone) {
      toast.error(
        "Please enter your phone number."
      );
      return;
    }

    if (!cleanEmail) {
      toast.error(
        "Please enter your email address."
      );
      return;
    }

    if (password.length < 6) {
      toast.error(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (
      password !== confirmPassword
    ) {
      toast.error(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/auth/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              password,
              role: registerRole,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Registration failed."
        );
      }

      toast.success(
        result.message ||
          "Registration submitted successfully."
      );

      // Clear form.
      setFullName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Return to Login.
      setIsRegister(false);

      // Keep the role selection ready for
      // the next registration.
      setRegisterRole("student");
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      toast.error(
        error?.message ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  async function handleForgotPassword() {
    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      toast.error(
        "Enter your email address first."
      );
      return;
    }

    try {
      await sendPasswordResetEmail(
        auth,
        cleanEmail
      );

      toast.success(
        "Password reset email sent. Check your inbox."
      );
    } catch (error) {
      switch (error?.code) {
        case "auth/user-not-found":
          toast.error(
            "No account found with this email."
          );
          break;

        case "auth/invalid-email":
          toast.error(
            "Please enter a valid email address."
          );
          break;

        case "auth/too-many-requests":
          toast.error(
            "Too many requests. Try again later."
          );
          break;

        default:
          toast.error(
            "Unable to send password reset email."
          );
      }
    }
  }

  // ============================================================
  // STYLES
  // ============================================================

  const inputClass =
    "w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200";

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="w-full max-w-md px-4 sm:px-0">

      <form
        onSubmit={(event) => {
          event.preventDefault();

          if (isRegister) {
            handleRegister();
          } else {
            handleLogin(event);
          }
        }}
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40 sm:p-8"
      >

        {/* ==================================================
            LOGO
        =================================================== */}

        <div className="flex justify-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 ring-8 ring-blue-50/60 dark:bg-blue-500/10">

            <GraduationCap
              size={34}
              className="text-blue-600 dark:text-blue-400"
            />

          </div>

        </div>

        {/* ==================================================
            BRAND
        =================================================== */}

        <div className="mt-5 text-center">

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            AUMNex
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Smart NFC Student Management System
          </p>

        </div>

        {/* ==================================================
            LOGIN / REGISTER
        =================================================== */}

        <div className="mt-7 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">

          <button
            type="button"
            onClick={() =>
              setIsRegister(false)
            }
            className={`w-1/2 rounded-lg py-2.5 text-sm font-semibold transition ${
              !isRegister
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() =>
              setIsRegister(true)
            }
            className={`w-1/2 rounded-lg py-2.5 text-sm font-semibold transition ${
              isRegister
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Register
          </button>

        </div>

        {/* ==================================================
            REGISTRATION ROLE
        =================================================== */}

        {isRegister && (
          <div className="mt-6">

            <div className="mb-3 flex items-center justify-between">

              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Account Type
              </p>

              <span className="text-xs text-slate-400">
                Choose once
              </span>

            </div>

            <div className="grid grid-cols-2 gap-3">

              {/* STUDENT */}

              <button
                type="button"
                onClick={() =>
                  setRegisterRole("student")
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  registerRole === "student"
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10 dark:bg-blue-500/10"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                }`}
              >

                <div className="flex items-center gap-3">

                  <div
                    className={`rounded-xl p-2 ${
                      registerRole === "student"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    }`}
                  >
                    <GraduationCap
                      size={20}
                    />
                  </div>

                  <div>

                    <p className="font-semibold text-slate-900 dark:text-white">
                      Student
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Student portal
                    </p>

                  </div>

                </div>

              </button>

              {/* ADMIN */}

              <button
                type="button"
                onClick={() =>
                  setRegisterRole("admin")
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  registerRole === "admin"
                    ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500/10 dark:bg-purple-500/10"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                }`}
              >

                <div className="flex items-center gap-3">

                  <div
                    className={`rounded-xl p-2 ${
                      registerRole === "admin"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    }`}
                  >
                    <Shield size={20} />
                  </div>

                  <div>

                    <p className="font-semibold text-slate-900 dark:text-white">
                      Admin
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Admin request
                    </p>

                  </div>

                </div>

              </button>

            </div>

            {/* ROLE INFORMATION */}

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">

              <Info
                size={15}
                className="mt-0.5 shrink-0"
              />

              {registerRole === "student" ? (
                <span>
                  Student accounts are reviewed and
                  activated by an administrator.
                </span>
              ) : (
                <span>
                  Admin registration creates an approval
                  request. An authorized administrator must
                  activate it before admin access is allowed.
                </span>
              )}

            </div>

          </div>
        )}

        {/* ==================================================
            FULL NAME
        =================================================== */}

        {isRegister && (
          <div className="mt-6">

            <label className={labelClass}>
              Full Name
            </label>

            <div className="relative">

              <User
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Enter your full name"
                className={`${inputClass} pl-11`}
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                autoComplete="name"
              />

            </div>

          </div>
        )}

        {/* ==================================================
            EMAIL
        =================================================== */}

        <div
          className={
            isRegister
              ? "mt-5"
              : "mt-7"
          }
        >

          <label className={labelClass}>
            Email Address
          </label>

          <div className="relative">

            <Mail
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="email"
              placeholder="you@example.com"
              className={`${inputClass} pl-11`}
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              autoComplete="email"
              required
            />

          </div>

        </div>

        {/* ==================================================
            PHONE
        =================================================== */}

        {isRegister && (
          <div className="mt-5">

            <label className={labelClass}>
              Phone Number
            </label>

            <div className="relative">

              <Phone
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="tel"
                placeholder="Enter your phone number"
                className={`${inputClass} pl-11`}
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                autoComplete="tel"
              />

            </div>

          </div>
        )}

        {/* ==================================================
            PASSWORD
        =================================================== */}

        <div className="mt-5">

          <label className={labelClass}>
            Password
          </label>

          <div className="relative">

            <LockKeyhole
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter your password"
              className={`${inputClass} pl-11 pr-12`}
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete={
                isRegister
                  ? "new-password"
                  : "current-password"
              }
              required
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>

          </div>

        </div>

        {/* ==================================================
            CONFIRM PASSWORD
        =================================================== */}

        {isRegister && (
          <div className="mt-5">

            <label className={labelClass}>
              Confirm Password
            </label>

            <div className="relative">

              <LockKeyhole
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Confirm your password"
                className={`${inputClass} pl-11`}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
              />

            </div>

          </div>
        )}

        {/* ==================================================
            FORGOT PASSWORD
        =================================================== */}

        {!isRegister && (
          <div className="mt-3 flex justify-end">

            <button
              type="button"
              onClick={
                handleForgotPassword
              }
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Forgot Password?
            </button>

          </div>
        )}

        {/* ==================================================
            SUBMIT
        =================================================== */}

        <button
          type="submit"
          disabled={loading}
          className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >

          {loading ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              {isRegister
                ? "Creating Account..."
                : "Signing In..."}
            </>
          ) : (
            isRegister
              ? `Create ${
                  registerRole === "admin"
                    ? "Admin Request"
                    : "Student Account"
                }`
              : "Sign In"
          )}

        </button>

        {/* ==================================================
            FOOTER
        =================================================== */}

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          AUMNex • Secure Student & Administrative Portal
        </p>

      </form>

    </div>
  );
}