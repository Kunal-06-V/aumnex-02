import { NextResponse } from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

export async function POST(request) {
  let createdUser = null;

  try {
    const body = await request.json();

    const name = String(
      body?.name || ""
    ).trim();

    const email = String(
      body?.email || ""
    ).trim().toLowerCase();

    const phone = String(
      body?.phone || ""
    ).trim();

    const password = String(
      body?.password || ""
    );

    const role = String(
      body?.role || ""
    ).trim().toLowerCase();

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!name) {
      return NextResponse.json(
        { message: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { message: "Email address is required." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { message: "Phone number is required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          message:
            "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    if (
      role !== "student" &&
      role !== "admin"
    ) {
      return NextResponse.json(
        {
          message:
            "Please select Student or Admin.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CREATE FIREBASE AUTH USER
    // =====================================================

    createdUser =
      await adminAuth.createUser({
        email,
        password,
        displayName: name,
      });

    const uid = createdUser.uid;
    const now = new Date().toISOString();

    const batch = adminDb.batch();

    // =====================================================
    // COMMON USERS DOCUMENT
    // =====================================================

    const userRef = adminDb
      .collection("users")
      .doc(uid);

    batch.set(userRef, {
      uid,
      email,
      name,
      phone,
      role,
      status: "Pending",
      createdAt: now,
      updatedAt: now,
    });

    // =====================================================
    // STUDENT REGISTRATION
    // =====================================================

    if (role === "student") {
      const studentRef = adminDb
        .collection("students")
        .doc(uid);

      batch.set(studentRef, {
        uid,
        role: "student",
        email,
        name,
        phone,

        status: "Pending",

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

        createdAt: now,
        updatedAt: now,
      });
    }

    // =====================================================
    // ADMIN REGISTRATION
    // =====================================================

    if (role === "admin") {
      const adminRef = adminDb
        .collection("admin")
        .doc(uid);

      batch.set(adminRef, {
        uid,
        name,
        email,
        phone,

        role: "Admin",
        status: "Pending",

        registrationType:
          "self-registration",

        createdAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();

    // =====================================================
    // SUCCESS MESSAGE
    // =====================================================

    if (role === "student") {
      return NextResponse.json(
        {
          success: true,
          role: "student",
          message:
            "Student registration submitted. An administrator must activate your account before login.",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        role: "admin",
        message:
          "Admin registration request submitted. A Super Admin must approve the account before administrator login.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Registration API error:",
      error
    );

    // =====================================================
    // ROLLBACK AUTH USER
    // =====================================================

    if (createdUser?.uid) {
      try {
        await adminAuth.deleteUser(
          createdUser.uid
        );
      } catch (rollbackError) {
        console.error(
          "Auth rollback failed:",
          rollbackError
        );
      }
    }

    // =====================================================
    // FIREBASE AUTH ERRORS
    // =====================================================

    switch (error?.code) {
      case "auth/email-already-exists":
        return NextResponse.json(
          {
            message:
              "This email is already registered.",
          },
          { status: 409 }
        );

      case "auth/invalid-email":
        return NextResponse.json(
          {
            message:
              "Invalid email address.",
          },
          { status: 400 }
        );

      case "auth/invalid-password":
        return NextResponse.json(
          {
            message:
              "Password does not meet Firebase requirements.",
          },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          {
            message:
              "Registration failed. Please try again.",
          },
          { status: 500 }
        );
    }
  }
}