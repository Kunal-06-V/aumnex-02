"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import {
  Eye,
  EyeOff,
  GraduationCap,
  Shield,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Check Admin Collection
      const adminQuery = query(
        collection(db, "admin"),
        where("email", "==", email)
      );

      const adminSnap = await getDocs(adminQuery);

      if (!adminSnap.empty) {
        router.push("/admin/dashboard");
        return;
      }

      // Check Student Collection
      const studentQuery = query(
        collection(db, "students"),
        where("email", "==", email)
      );

      const studentSnap = await getDocs(studentQuery);

      if (!studentSnap.empty) {
        router.push("/student/dashboard");
        return;
      }

      alert("User record not found.");

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }
    return (
    <div className="w-full max-w-md">

      <form
        onSubmit={handleLogin}
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

          </div>

        </div>

        <div className="flex justify-end mt-3">

          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot Password?
          </button>

        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold transition"
        >
          {loading
            ? "Signing In..."
            : "Login"}
        </button>

        <p className="text-center text-gray-500 text-sm mt-6">
          One Login for Students & Admin
        </p>

      </form>

    </div>
  );
}