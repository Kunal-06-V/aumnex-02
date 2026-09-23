import { NextResponse } from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

import {
  markNfcAttendance,
} from "@/lib/nfcAttendanceService";

function normalizeNfcUid(value) {
  return String(value || "")
    .trim()
    .replace(/[\s:-]/g, "")
    .toUpperCase();
}

function isValidNfcUid(uid) {
  return (
    /^[0-9A-F]+$/.test(uid) &&
    uid.length >= 8 &&
    uid.length <= 32
  );
}

async function authenticateNfcReader(request) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    const error =
      new Error(
        "NFC reader authentication is required."
      );

    error.code =
      "READER_AUTH_REQUIRED";

    throw error;
  }

  const idToken =
    authorization
      .substring(7)
      .trim();

  if (!idToken) {
    const error =
      new Error(
        "NFC reader authentication token is missing."
      );

    error.code =
      "READER_AUTH_REQUIRED";

    throw error;
  }

  let decodedToken;

  try {
    decodedToken =
      await adminAuth.verifyIdToken(
        idToken
      );
  } catch (verifyError) {
    console.error(
      "NFC reader token verification failed:",
      verifyError
    );

    const error =
      new Error(
        "Invalid or expired NFC reader authentication token."
      );

    error.code =
      "READER_AUTH_INVALID";

    throw error;
  }

  const readerRef =
    adminDb
      .collection("nfcReaders")
      .doc(decodedToken.uid);

  const readerSnap =
    await readerRef.get();

  if (!readerSnap.exists) {
    const error =
      new Error(
        "This device is not registered as an NFC reader."
      );

    error.code =
      "READER_NOT_REGISTERED";

    throw error;
  }

  const reader =
    readerSnap.data();

  if (
    reader.role !==
    "nfc-reader"
  ) {
    const error =
      new Error(
        "This account is not authorized as an NFC reader."
      );

    error.code =
      "READER_NOT_AUTHORIZED";

    throw error;
  }

  if (
    reader.status !==
    "Active"
  ) {
    const error =
      new Error(
        "This NFC reader is inactive."
      );

    error.code =
      "READER_INACTIVE";

    throw error;
  }

  return decodedToken;
}

export async function POST(
  request
) {
  try {
    // ----------------------------------------------------------
    // 1. Authenticate the physical NFC reader
    // ----------------------------------------------------------

    await authenticateNfcReader(
      request
    );

    // ----------------------------------------------------------
    // 2. Read request body
    // ----------------------------------------------------------

    const body =
      await request.json();

    const nfcUid =
      normalizeNfcUid(
        body?.nfcUid
      );

    if (!nfcUid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "NFC UID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidNfcUid(
        nfcUid
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid NFC UID format.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------------------------------
    // 3. Mark attendance
    // ----------------------------------------------------------

    const result =
      await markNfcAttendance(
        nfcUid
      );

    return NextResponse.json(
      result,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "NFC attendance API error:",
      error
    );

    let status = 500;

    switch (
      error.code
    ) {
      case "READER_AUTH_REQUIRED":
      case "READER_AUTH_INVALID":
        status = 401;
        break;

      case "READER_NOT_REGISTERED":
      case "READER_NOT_AUTHORIZED":
      case "READER_INACTIVE":
        status = 403;
        break;

      case "INVALID_NFC_UID":
        status = 400;
        break;

      case "STUDENT_NOT_FOUND":
        status = 404;
        break;

      case "STUDENT_INACTIVE":
        status = 403;
        break;

      case "NFC_UID_DUPLICATE":
      case "ALREADY_MARKED":
        status = 409;
        break;

      case "SESSION_NOT_FOUND":
        status = 404;
        break;

      case "SESSION_NOT_ACTIVE":
      case "SESSION_ID_MISSING":
      case "SESSION_CONFIG_INVALID":
      case "SESSION_MISMATCH":
        status = 400;
        break;

      default:
        status = 500;
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "NFC attendance failed.",
      },
      {
        status,
      }
    );
  }
}