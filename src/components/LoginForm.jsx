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
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import {
  Eye,
  EyeOff,
  GraduationCap,
  Shield,
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

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Logged In UID:", auth.currentUser.uid);

      // Check Admin Document
      const adminRef = doc(db, "admin", auth.currentUser.uid);

      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        toast.success("Welcome Admin!");
        router.push("/admin/dashboard");
        return;
      }

      // Check Student Document
      const studentRef = doc(db, "students", auth.currentUser.uid);

      console.log("Checking document:", studentRef.path);

      const studentSnap = await getDoc(studentRef);

      console.log("Document exists:", studentSnap.exists());

      if (studentSnap.exists()) {
        console.log("Student Data:", studentSnap.data());
      }

      if (studentSnap.exists()) {

        const studentData = studentSnap.data();

        setStudent(studentData);

        toast.success(`Welcome ${studentData.name}!`);

        router.push("/student/dashboard");

        return;
      }

      toast.error("User record not found.");

    } catch (error) {
      console.error("LOGIN ERROR:", error);
      console.error("ERROR CODE:", error.code);
      console.error("ERROR MESSAGE:", error.message);
      switch (error.code) {
        case "auth/invalid-credential":
          toast.error("Invalid email or password.");
          break;

        case "auth/user-not-found":
          toast.error("User not found.");
          break;

        case "auth/wrong-password":
          toast.error("Incorrect password.");
          break;

        case "auth/invalid-email":
          toast.error("Invalid email address.");
          break;

        case "auth/too-many-requests":
          toast.error("Too many login attempts. Please try again later.");
          break;

        default:
          toast.error("Something went wrong. Please try again.");
      }

      setPassword("");   // 👈 Add this here
    } finally {
      setLoading(false);
    }
  }
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
      toast.error("Password must be at least 6 characters.");
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
          email,
          password
        );

      console.log("New UID:", userCredential.user.uid);
      const uid = userCredential.user.uid;

await setDoc(doc(db, "students", uid), {
  uid,
  role: "student",
  email,
  status: "Active",

  name: fullName,
  email,
  phone,

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

await setDoc(doc(db, "users", uid), {
  uid,
  role: "student",
  email,
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
  async function handleForgotPassword() {
    if (!email.trim()) {
      toast.error("Please enter your email address first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);

      toast.success("Password reset email sent. Check your inbox.");
    } catch (error) {
      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found with this email.");
          break;

        case "auth/invalid-email":
          toast.error("Please enter a valid email address.");
          break;

        default:
          toast.error("Failed to send password reset email.");
      }
    }
  }
  return (
    <div className="w-full max-w-md">

      <form
        onSubmit={(e) => {
          e.preventDefault();

          if (isRegister) {
            handleRegister();
          } else {
            handleLogin(e);
          }
        }}
        className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 border border-gray-200"
      >

        {/* Logo */}

        <div className="flex justify-center mb-5">

          <div className="bg-blue-100 p-5 rounded-full">

            <GraduationCap
              size={45}
              className="text-blue-700"
            />

          </div>

        </div>

        <h1 className="text-4xl font-bold text-center text-blue-700">
          AUMNex
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Smart NFC Student Management System
        </p>
        {/* Login / Register Tabs */}

        <div className="mt-8 flex bg-gray-100 rounded-xl p-1">

          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`w-1/2 py-2 rounded-lg font-semibold transition ${!isRegister
              ? "bg-blue-600 text-white shadow"
              : "text-gray-600"
              }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`w-1/2 py-2 rounded-lg font-semibold transition ${isRegister
              ? "bg-blue-600 text-white shadow"
              : "text-gray-600"
              }`}
          >
            Register
          </button>

        </div>

        <div className="flex justify-center gap-6 mt-6">

          <div className="flex items-center gap-2 text-blue-600">
            <GraduationCap size={18} />
            <span className="text-sm font-medium">
              Student
            </span>
          </div>

          <div className="flex items-center gap-2 text-purple-600">
            <Shield size={18} />
            <span className="text-sm font-medium">
              Admin
            </span>
          </div>

        </div>
        {/* Full Name (Register Only) */}

        {isRegister && (
          <div className="mt-8">

            <label className="block text-sm font-medium mb-2">
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

          </div>
        )}

        {/* Email */}

        <div className="mt-8">

          <label className="block text-sm font-medium mb-2">
            Email Address
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

        </div>
        {/* Phone Number (Register Only) */}

        {isRegister && (
          <div className="mt-5">

            <label className="block text-sm font-medium mb-2">
              Phone Number
            </label>

            <input
              type="text"
              placeholder="Enter your phone number"
              className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

          </div>
        )}

        {/* Password */}

        <div className="mt-5">

          <label className="block text-sm font-medium mb-2">
            Password
          </label>

          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="w-full p-3 pr-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="absolute right-4 top-3.5 text-gray-500"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
            {isRegister && (
              <div className="mt-5">

                <label className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

              </div>
            )}

          </div>

        </div>

        {!isRegister && (
          <div className="flex justify-end mt-3">

            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </button>

          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold transition"
        >
          {loading
            ? (isRegister ? "Registering..." : "Signing In...")
            : (isRegister ? "Register" : "Login")}
        </button>

        <p className="text-center text-gray-500 text-sm mt-6">
          One Login for Students & Admin
        </p>


      </form>

    </div>
  );
}