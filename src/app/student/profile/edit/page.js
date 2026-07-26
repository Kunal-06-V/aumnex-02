"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function EditProfile() {
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
const [loading, setLoading] = useState(false);
const router = useRouter();
useEffect(() => {
  async function fetchStudent() {
    const docRef = doc(db, "students", "student001");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setFormData({
  name: "",
  email: "",
  phone: "",
  address: "",
  department: "",
  semester: "",
  division: "",
  batch: "",
  dob: "",
  ...docSnap.data(),
});
    }
  }

  fetchStudent();
}, []);
async function handleSave(e) {
  e.preventDefault();
  setLoading(true);

  // Validation
if (formData.name.trim() === "") {
  toast.error("Full Name is required.");
  setLoading(false);
  return;
}

if (formData.phone.length !== 10) {
  toast.error("Phone number must be valid.");
  setLoading(false);
  return;
}

if (formData.address.trim() === "") {
  toast.error("Address is required.");
  setLoading(false);
  return;
}

  try {
    await updateDoc(doc(db, "students", "student001"), {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      division: formData.division,
      batch: formData.batch,
      dob: formData.dob,
    });

    toast.success("Profile updated successfully.");
    setLoading(false);
    router.push("/student/profile");
  } catch (error) {
    console.error(error);
    setLoading(false);
    toast.error("Failed to update profile.");
  }
}
  return (
    <div className="p-8 bg-gray-100 min-h-screen">

      <h1 className="text-3xl font-bold text-blue-700 mb-6">
        Edit Profile
      </h1>

      <div className="bg-white rounded-2xl shadow-lg p-8">

        <h2 className="text-2xl font-semibold mb-6">
          Update Your Information
        </h2>

<form
  onSubmit={handleSave}
  className="grid grid-cols-1 md:grid-cols-2 gap-6"
>
  {/* Full Name */}
  <div>
    <label className="block text-gray-700 font-medium mb-2">
      Full Name
    </label>

    <input
  type="text"
value={formData.name || ""}
  onChange={(e) =>
    setFormData({
      ...formData,
      name: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
/>
  </div>

  {/* Email */}
  <div>
    <label className="block text-gray-700 font-medium mb-2">
      Email
    </label>

    <input
  type="email"
  value={formData.email || ""}
  disabled
  className="w-full border rounded-lg p-3 bg-gray-100"
/>
  </div>

  {/* Phone */}
  <div>
    <label className="block text-gray-700 font-medium mb-2">
      Phone Number
    </label>

    <input
  type="text"
  value={formData.phone || ""}
  onChange={(e) =>
    setFormData({
      ...formData,
      phone: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
/>
  </div>
{/* Address */}
<div className="md:col-span-2">
  <label className="block text-gray-700 font-medium mb-2">
    Address
  </label>

  <textarea
  rows="3"
  value={formData.address || ""}
  onChange={(e) =>
    setFormData({
      ...formData,
      address: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
/>
</div>

{/* Department */}
<div>
  <label className="block text-gray-700 font-medium mb-2">
    Department
  </label>

  <input
    type="text"
    placeholder="Computer Engineering"
    disabled
    className="w-full border rounded-lg p-3 bg-gray-100"
  />
</div>

{/* Semester */}
<div>
  <label className="block text-gray-700 font-medium mb-2">
    Semester
  </label>

  <input
    type="text"
    placeholder="4"
    disabled
    className="w-full border rounded-lg p-3 bg-gray-100"
  />
</div>

{/* Division */}
<div>
  <label className="block text-gray-700 font-medium mb-2">
    Division
  </label>

  <input
  type="text"
  value={formData.division || ""}
  onChange={(e) =>
    setFormData({
      ...formData,
      division: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
/>
</div>

{/* Batch */}
<div>
  <label className="block text-gray-700 font-medium mb-2">
    Batch
  </label>

  <input
  type="text"
  value={formData.batch || ""}
  onChange={(e) =>
    setFormData({
      ...formData,
      batch: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
/>
</div>

{/* Date of Birth */}
<div>
  <label className="block text-gray-700 font-medium mb-2">
    Date of Birth
  </label>

  <input
  type="date"
  value={formData.dob || ""}
  onChange={(e) =>
    setFormData({
      ...formData,
      dob: e.target.value,
    })
  }
  className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
/>
</div>

{/* Buttons */}
<div className="md:col-span-2 flex justify-end gap-4 mt-6">
<button
  type="button"
  onClick={() => router.push("/student/profile")}
  className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
>
  Cancel
</button>

  <button
  type="submit"
  disabled={loading}
  className={`px-6 py-3 rounded-lg text-white transition ${
    loading
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700"
  }`}
>
  {loading ? "Saving..." : "Save Changes"}
</button>

</div>
</form>


      </div>

    </div>
  );
}