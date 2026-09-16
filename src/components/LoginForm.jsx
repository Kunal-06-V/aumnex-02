"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
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
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import { useStudent } from "@/context/StudentContext";

export default function LoginForm() {
  const router = useRouter();
  const { setStudent } = useStudent();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  // ============================================================
  // LOGIN
  // ============================================================
async function handleLogin(e) {
  e.preventDefault();

  if (loading) return;

  const cleanEmail = email.trim();

  if (!cleanEmail || !password) {
    toast.error("Please enter email and password.");
    return;
  }

  setLoading(true);

  try {
    console.log("LOGIN STEP 1: Starting Firebase login");

    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

    const user = userCredential.user;

    console.log(
      "LOGIN STEP 2: Firebase login successful"
    );

    console.log("UID:", user.uid);
    console.log("Email:", user.email);

    // ========================================================
    // CHECK ADMIN
    // ========================================================

    console.log(
      "LOGIN STEP 3: Checking admin document"
    );

    const adminQuery = query(
      collection(db, "admin"),
      where("uid", "==", user.uid)
    );

    const adminSnapshot =
      await getDocs(adminQuery);

    console.log(
      "Admin document exists:",
      !adminSnapshot.empty
    );

    if (!adminSnapshot.empty) {
      const adminData =
        adminSnapshot.docs[0].data();

      console.log(
        "LOGIN STEP 4: Admin document loaded",
        adminData
      );

      toast.success("Welcome Admin!");

      router.push("/admin/dashboard");

      return;
    }

    // ========================================================
    // CHECK STUDENT
    // ========================================================

    console.log(
      "LOGIN STEP 5: Checking student document"
    );

    const studentRef = doc(
      db,
      "students",
      user.uid
    );

    const studentSnap =
      await getDoc(studentRef);

    console.log(
      "Student document exists:",
      studentSnap.exists()
    );

    if (studentSnap.exists()) {
      const studentData =
        studentSnap.data();

      console.log(
        "LOGIN STEP 6: Student document loaded",
        studentData
      );

      setStudent(studentData);

      toast.success(
        `Welcome ${studentData.name}!`
      );

      console.log(
        "LOGIN STEP 7: Redirecting to student dashboard"
      );

      router.push("/student/dashboard");

      return;
    }

    toast.error(
      "Firebase login succeeded, but no student/admin record was found."
    );
  } catch (error) {
    console.error(
      "========== LOGIN ERROR =========="
    );

    console.error(
      "Code:",
      error.code
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Full error:",
      error
    );

    console.error(
      "================================="
    );

    switch (error.code) {
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
          "Invalid email address."
        );
        break;

      case "auth/too-many-requests":
        toast.error(
          "Too many login attempts. Try again later."
        );
        break;

      case "auth/network-request-failed":
        toast.error(
          "Network error. Check the internet connection."
        );
        break;

      case "auth/operation-not-allowed":
        toast.error(
          "Email/password login is disabled in Firebase."
        );
        break;

      default:
        toast.error(
          `Login failed: ${
            error.code || error.message
          }`
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
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    if (password.length < 6) {
      toast.error(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      console.log(
        "New UID:",
        userCredential.user.uid
      );

      const uid = userCredential.user.uid;

      // Create student document
      await setDoc(doc(db, "students", uid), {
        uid,
        role: "student",
        email: email.trim(),
        status: "Active",

        name: fullName.trim(),
        phone: phone.trim(),

        department: "",
        semester: "",
        division: "",
        rollNo: "",
        prn: "",

        attendancePercentage: 0,
        overallCGPA: 0,

        totalFees: 0,
        feesPaid: 0,
        feesPending: 0,

        profileImage: "",
        nfcUid: "",

        createdAt: new Date().toISOString(),
      });

      // Create users document
      await setDoc(doc(db, "users", uid), {
        uid,
        role: "student",
        email: email.trim(),
      });

      toast.success("Registration successful!");

      setFullName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      router.push("/student/dashboard");
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      console.error("ERROR CODE:", error.code);
      console.error("ERROR MESSAGE:", error.message);

      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error("Email already registered.");
          break;

        case "auth/invalid-email":
          toast.error("Invalid email.");
          break;

        case "auth/weak-password":
          toast.error("Weak password.");
          break;

        default:
          toast.error("Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  async function handleForgotPassword() {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      toast.error(
        "Please enter your email address first."
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
      switch (error.code) {
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

        default:
          toast.error(
            "Failed to send password reset email."
          );
      }
    }
  }

  // ============================================================
  // INPUT STYLES
  // ============================================================

  const inputClass =
    "w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/10";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200";

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="w-full max-w-md px-4 sm:px-0">

      <form
        onSubmit={(e) => {
          e.preventDefault();

          if (isRegister) {
            handleRegister();
          } else {
            handleLogin(e);
          }
        }}
        className="
          overflow-hidden
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-2xl
          shadow-slate-300/40
          dark:border-slate-800
          dark:bg-slate-900
          dark:shadow-black/40
          sm:p-8
        "
      >

        {/* ====================================================
            LOGO
        ==================================================== */}

        <div className="flex justify-center">

          <div
            className="
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-blue-50
              ring-8
              ring-blue-50/60
              dark:bg-blue-500/10
              dark:ring-blue-500/5
            "
          >
            <GraduationCap
              size={34}
              strokeWidth={2.2}
              className="text-blue-600 dark:text-blue-400"
            />
          </div>

        </div>

        {/* ====================================================
            BRAND
        ==================================================== */}

        <div className="mt-5 text-center">

          <h1
            className="
              text-3xl
              font-bold
              tracking-tight
              text-slate-900
              dark:text-white
            "
          >
            AUMNex
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            Smart NFC Student Management System
          </p>

        </div>

        {/* ====================================================
            LOGIN / REGISTER TABS
        ==================================================== */}

        <div
          className="
            mt-7
            flex
            rounded-xl
            bg-slate-100
            p-1
            dark:bg-slate-800
          "
        >

          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`
              w-1/2
              rounded-lg
              py-2.5
              text-sm
              font-semibold
              transition-all
              ${
                !isRegister
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }
            `}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`
              w-1/2
              rounded-lg
              py-2.5
              text-sm
              font-semibold
              transition-all
              ${
                isRegister
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }
            `}
          >
            Register
          </button>

        </div>

        {/* ====================================================
            ROLE INDICATOR
        ==================================================== */}

        <div className="mt-5 flex justify-center gap-7">

          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <GraduationCap size={17} />
            <span className="text-sm font-medium">
              Student
            </span>
          </div>

          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Shield size={17} />
            <span className="text-sm font-medium">
              Admin
            </span>
          </div>

        </div>

        {/* ====================================================
            REGISTER NAME
        ==================================================== */}

        {isRegister && (
          <div className="mt-7">

            <label className={labelClass}>
              Full Name
            </label>

            <div className="relative">

              <User
                size={18}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                  dark:text-slate-500
                "
              />

              <input
                type="text"
                placeholder="Enter your full name"
                className={`${inputClass} pl-11`}
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                autoComplete="name"
              />

            </div>

          </div>
        )}

        {/* ====================================================
            EMAIL
        ==================================================== */}

        <div className={isRegister ? "mt-5" : "mt-7"}>

          <label className={labelClass}>
            Email Address
          </label>

          <div className="relative">

            <Mail
              size={18}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-slate-400
                dark:text-slate-500
              "
            />

            <input
              type="email"
              placeholder="Enter your email"
              className={`${inputClass} pl-11`}
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
              required
            />

          </div>

        </div>

        {/* ====================================================
            PHONE
        ==================================================== */}

        {isRegister && (
          <div className="mt-5">

            <label className={labelClass}>
              Phone Number
            </label>

            <div className="relative">

              <Phone
                size={18}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                  dark:text-slate-500
                "
              />

              <input
                type="tel"
                placeholder="Enter your phone number"
                className={`${inputClass} pl-11`}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                autoComplete="tel"
              />

            </div>

          </div>
        )}

        {/* ====================================================
            PASSWORD
        ==================================================== */}

        <div className="mt-5">

          <label className={labelClass}>
            Password
          </label>

          <div className="relative">

            <LockKeyhole
              size={18}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-slate-400
                dark:text-slate-500
              "
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
              onChange={(e) =>
                setPassword(e.target.value)
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
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                rounded-lg
                p-2
                text-slate-400
                transition
                hover:bg-slate-100
                hover:text-slate-700
                dark:hover:bg-slate-800
                dark:hover:text-slate-200
              "
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>

          </div>

        </div>

        {/* ====================================================
            CONFIRM PASSWORD
        ==================================================== */}

        {isRegister && (
          <div className="mt-5">

            <label className={labelClass}>
              Confirm Password
            </label>

            <div className="relative">

              <LockKeyhole
                size={18}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                  dark:text-slate-500
                "
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
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                autoComplete="new-password"
              />

            </div>

          </div>
        )}

        {/* ====================================================
            FORGOT PASSWORD
        ==================================================== */}

        {!isRegister && (
          <div className="mt-3 flex justify-end">

            <button
              type="button"
              onClick={handleForgotPassword}
              className="
                text-sm
                font-medium
                text-blue-600
                hover:text-blue-700
                hover:underline
                dark:text-blue-400
                dark:hover:text-blue-300
              "
            >
              Forgot Password?
            </button>

          </div>
        )}

        {/* ====================================================
            SUBMIT BUTTON
        ==================================================== */}

        <button
          type="submit"
          disabled={loading}
          className="
            mt-7
            flex
            h-12
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-blue-600
            text-sm
            font-semibold
            text-white
            shadow-lg
            shadow-blue-600/20
            transition-all
            hover:bg-blue-700
            hover:shadow-blue-600/30
            disabled:cursor-not-allowed
            disabled:bg-slate-400
            disabled:shadow-none
            dark:bg-blue-600
            dark:hover:bg-blue-500
          "
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
              ? "Create Account"
              : "Login"
          )}

        </button>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <p
          className="
            mt-6
            text-center
            text-xs
            text-slate-500
            dark:text-slate-400
          "
        >
          One secure login for Students & Admin
        </p>

      </form>

    </div>
  );
    }