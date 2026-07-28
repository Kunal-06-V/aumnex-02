"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword,
  signOut,
 } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { auth, db } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
   async function handleRegister() {
  if (!form.name || !form.email || !form.password) {
    toast.error("Please fill all required fields.");
    return;
  }

  try {
    // Create Firebase Authentication account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      form.email,
      form.password
    );

    const uid = userCredential.user.uid;

    // Create users/{uid}
    await setDoc(doc(db, "users", uid), {
      role: "student",
      email: form.email,
    });

    // Create students/{uid}
    await setDoc(doc(db, "students", uid), {
      uid: uid,
      name: form.name,
      email: form.email,
      phone: form.phone,
      rollNo: "",
      prn: "",
      department: "",
      semester: "",
      createdAt: new Date(),
    });

    toast.success("Student registered successfully!");

await signOut(auth);

router.push("/");
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-6">
          Student Registration
        </h1>

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
            className="w-full border rounded-xl p-3"
          />

          <button
  onClick={handleRegister}
  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3"
>
  Register
</button>

        </div>

      </div>
    </div>
  );
}