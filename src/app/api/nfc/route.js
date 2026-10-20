import { NextResponse } from "next/server";
import { performance } from "node:perf_hooks";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebaseAdmin";

import {
  markNfcAttendance,
} from "@/lib/nfcAttendanceService";

export const runtime = "nodejs";

function logNfcTiming(phase, startTime, outcome = "success") {
  console.info("[NFC_TIMING]", {
    phase,
    durationMs: Number(
      (performance.now() - startTime).toFixed(1)
    ),
    outcome,
  });
}

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
  const authStart = performance.now();

  const authorization =
    request.headers.get("authorization");

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    const error = new Error(
      "NFC reader authentication is required."
    );

    error.code = "READER_AUTH_REQUIRED";
    throw error;
  }

  const idToken = authorization
    .substring(7)
    .trim();

  if (!idToken) {
    const error = new Error(
      "NFC reader authentication token is missing."
    );

    error.code = "READER_AUTH_REQUIRED";
    throw error;
  }

  let decodedToken;
  const tokenStart = performance.now();

  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);

    logNfcTiming(
      "token_verification",
      tokenStart
    );
  } catch (verifyError) {
    logNfcTiming(
      "token_verification",
      tokenStart,
      "failed"
    );

    console.error(
      "NFC reader token verification failed:",
      verifyError
    );

    const error = new Error(
      "Invalid or expired NFC reader authentication token."
    );

    error.code = "READER_AUTH_INVALID";
    throw error;
  }

  const readerRef = adminDb
    .collection("nfcReaders")
    .doc(decodedToken.uid);

  const readerLookupStart = performance.now();
  let readerSnap;

  try {
    readerSnap = await readerRef.get();

    logNfcTiming(
      "reader_document_lookup",
      readerLookupStart,
      readerSnap.exists ? "success" : "not_found"
    );
  } catch (lookupError) {
    logNfcTiming(
      "reader_document_lookup",
      readerLookupStart,
      "failed"
    );

    throw lookupError;
  }

  if (!readerSnap.exists) {
    const error = new Error(
      "This device is not registered as an NFC reader."
    );

    error.code = "READER_NOT_REGISTERED";
    throw error;
  }

  const reader = readerSnap.data();

  if (reader.role !== "nfc-reader") {
    const error = new Error(
      "This account is not authorized as an NFC reader."
    );

    error.code = "READER_NOT_AUTHORIZED";
    throw error;
  }

  if (reader.status !== "Active") {
    const error = new Error(
      "This NFC reader is inactive."
    );

    error.code = "READER_INACTIVE";
    throw error;
  }

  logNfcTiming("reader_authentication_total", authStart);

  return decodedToken;
}

export async function POST(request) {
  const requestStart = performance.now();
  let currentPhase = "authenticate_reader";

  try {
    // 1. Authenticate the physical NFC reader.
    await authenticateNfcReader(request);

    // 2. Read and validate the request body.
    currentPhase = "parse_request_body";

    const bodyStart = performance.now();
    const body = await request.json();

    const nfcUid = normalizeNfcUid(body?.nfcUid);

    logNfcTiming("request_body_parsing", bodyStart);

    if (!nfcUid) {
      logNfcTiming(
        "request_total",
        requestStart,
        "invalid_uid"
      );

      return NextResponse.json(
        {
          success: false,
          message: "NFC UID is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidNfcUid(nfcUid)) {
      logNfcTiming(
        "request_total",
        requestStart,
        "invalid_uid"
      );

      return NextResponse.json(
        {
          success: false,
          message: "Invalid NFC UID format.",
        },
        { status: 400 }
      );
    }

    // 3. Mark attendance.
    currentPhase = "mark_attendance";

    const serviceStart = performance.now();
    let result;
    let serviceOutcome = "success";

    try {
      result = await markNfcAttendance(nfcUid);
    } catch (serviceError) {
      serviceOutcome = "failed";
      throw serviceError;
    } finally {
      logNfcTiming(
        "attendance_service",
        serviceStart,
        serviceOutcome
      );
    }

    logNfcTiming("request_total", requestStart);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logNfcTiming(
      `request_total:${currentPhase}`,
      requestStart,
      "failed"
    );

    console.error("NFC attendance API error:", error);

    let status = 500;

    switch (error.code) {
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
      case "SESSION_NOT_FOUND":
        status = 404;
        break;

      case "STUDENT_INACTIVE":
        status = 403;
        break;

      case "NFC_UID_DUPLICATE":
      case "ALREADY_MARKED":
        status = 409;
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
      { status }
    );
  }
}