"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

async function handleLogin(e) {
  e.preventDefault();

  try {
    await signInWithEmailAndPassword(auth, email, password);

alert("Login Successful!");
router.push("/student/dashboard");
  } catch (error) {
    alert(error.message);
  }
}

  return (
    <form
      onSubmit={handleLogin}
      className="bg-white shadow-xl rounded-2xl p-8 w-96"
    >
      <h1 className="text-4xl font-bold text-center text-blue-700">
        AUMNex
      </h1>

      <p className="text-center text-gray-500 mt-2">
        Smart College Management System
      </p>

      <input
        type="email"
        placeholder="Email"
        className="w-full mt-8 p-3 border rounded-lg"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="w-full mt-4 p-3 border rounded-lg"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-3 rounded-lg mt-6"
      >
        Student Login
      </button>
    </form>
  );
}