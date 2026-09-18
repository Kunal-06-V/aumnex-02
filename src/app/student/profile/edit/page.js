"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";

export default function EditProfile() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    semester: "",
    division: "",
    batch: "",
    dob: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ==============================
  // FETCH LOGGED-IN STUDENT
  // ==============================

  useEffect(() => {
    async function fetchStudent() {
      try {
        const user = auth.currentUser;

        if (!user) {
          router.push("/");
          return;
        }

        const studentRef = doc(
          db,
          "students",
          user.uid
        );

        const studentSnap =
          await getDoc(studentRef);

        if (!studentSnap.exists()) {
          toast.error(
            "Student profile not found."
          );

          router.push(
            "/student/profile"
          );

          return;
        }

        setFormData((prev) => ({
          ...prev,
          ...studentSnap.data(),
        }));
      } catch (error) {
        console.error(
          "Failed to fetch student:",
          error
        );

        toast.error(
          "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchStudent();
  }, [router]);

  // ==============================
  // HANDLE INPUT CHANGES
  // ==============================

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // ==============================
  // SAVE PROFILE
  // ==============================

  async function handleSave(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error(
        "Enter a valid 10-digit phone number."
      );
      return;
    }

    if (!formData.address.trim()) {
      toast.error(
        "Address is required."
      );
      return;
    }

    try {
      setSaving(true);

      const user = auth.currentUser;

      if (!user) {
        toast.error(
          "Please login again."
        );

        router.push("/");
        return;
      }

      const studentRef = doc(
        db,
        "students",
        user.uid
      );

      // Only personal profile fields can
      // be changed by the student.
      await updateDoc(studentRef, {
        name: formData.name.trim(),
        phone: formData.phone,
        address: formData.address.trim(),
        dob: formData.dob,
      });

      toast.success(
        "Profile updated successfully."
      );

      router.push(
        "/student/profile"
      );
    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      toast.error(
        "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div className="space-y-6">

        <PageHeader
          title="Edit Profile"
          subtitle="Update your personal information"
        />

        <div className="bg-white rounded-2xl shadow-lg p-8 animate-pulse">

          <div className="h-8 bg-gray-200 rounded w-64 mb-8" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {[1, 2, 3, 4, 5, 6, 7, 8].map(
              (item) => (
                <div key={item}>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-12 bg-gray-200 rounded-lg" />
                </div>
              )
            )}

          </div>

        </div>

      </div>
    );
  }

  // ==============================
  // PAGE
  // ==============================

  return (
    <div className="space-y-6">

      <PageHeader
        title="Edit Profile"
        subtitle="Update your personal information"
      />

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl shadow-lg p-8 space-y-8"
      >

        {/* =========================
            PERSONAL INFORMATION
        ========================== */}

        <div>

          <h2 className="text-2xl font-semibold text-slate-800">
            Personal Information
          </h2>

          <p className="text-gray-500 mt-1">
            Update the information you want
            to change.
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* NAME */}

          <div>

            <label className="block mb-2 font-medium text-gray-700">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* EMAIL */}

          <div>

            <label className="block mb-2 font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full border border-gray-300 rounded-xl p-3 bg-gray-100 text-gray-500 cursor-not-allowed"
            />

            <p className="text-xs text-gray-500 mt-1">
              Email is managed through your account.
            </p>

          </div>

          {/* PHONE */}

          <div>

            <label className="block mb-2 font-medium text-gray-700">
              Phone Number
            </label>

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              placeholder="10-digit phone number"
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* DATE OF BIRTH */}

          <div>

            <label className="block mb-2 font-medium text-gray-700">
              Date of Birth
            </label>

            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* ADDRESS */}

          <div className="md:col-span-2">

            <label className="block mb-2 font-medium text-gray-700">
              Address
            </label>

            <textarea
              name="address"
              rows={4}
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address"
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

          </div>

        </div>

        {/* =========================
            ACADEMIC INFORMATION
        ========================== */}

        <div className="border-t pt-8">

          <h2 className="text-2xl font-semibold text-slate-800">
            Academic Information
          </h2>

          <p className="text-gray-500 mt-1 mb-6">
            Academic details are controlled by
            the administration.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* DEPARTMENT */}

            <div>

              <label className="block mb-2 font-medium text-gray-700">
                Department
              </label>

              <input
                type="text"
                value={formData.department}
                disabled
                className="w-full border border-gray-300 rounded-xl p-3 bg-gray-100 text-gray-500 cursor-not-allowed"
              />

            </div>

            {/* SEMESTER */}

            <div>

              <label className="block mb-2 font-medium text-gray-700">
                Semester
              </label>

              <input
                type="text"
                value={formData.semester}
                disabled
                className="w-full border border-gray-300 rounded-xl p-3 bg-gray-100 text-gray-500 cursor-not-allowed"
              />

            </div>

            {/* DIVISION */}

            <div>

              <label className="block mb-2 font-medium text-gray-700">
                Division
              </label>

              <input
                type="text"
                value={formData.division}
                disabled
                className="w-full border border-gray-300 rounded-xl p-3 bg-gray-100 text-gray-500 cursor-not-allowed"
              />

            </div>

            {/* BATCH */}

            <div>

              <label className="block mb-2 font-medium text-gray-700">
                Batch
              </label>

              <input
                type="text"
                value={formData.batch}
                disabled
                className="w-full border border-gray-300 rounded-xl p-3 bg-gray-100 text-gray-500 cursor-not-allowed"
              />

            </div>

          </div>

        </div>

        {/* =========================
            BUTTONS
        ========================== */}

        <div className="border-t pt-6 flex justify-end gap-4">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/student/profile"
              )
            }
            disabled={saving}
            className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-3 rounded-xl text-white transition ${
              saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </form>

    </div>
  );
}