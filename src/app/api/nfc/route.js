import { NextResponse } from "next/server";
import { markNfcAttendance } from "@/lib/nfcAttendanceService";

export async function POST(request) {
  try {
    const body = await request.json();
    const nfcUid = body.nfcUid;

    if (!nfcUid) {
      return NextResponse.json(
        {
          success: false,
          message: "NFC UID is required.",
        },
        { status: 400 }
      );
    }

    const result = await markNfcAttendance(nfcUid);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("NFC attendance API error:", error);

    let status = 500;

    switch (error.code) {
      case "STUDENT_NOT_FOUND":
        status = 404;
        break;

      case "SESSION_NOT_FOUND":
      case "SESSION_NOT_ACTIVE":
      case "SESSION_ID_MISSING":
      case "SESSION_MISMATCH":
        status = 400;
        break;

      case "ALREADY_MARKED":
        status = 409;
        break;

      default:
        status = 500;
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "NFC attendance failed.",
      },
      { status }
    );
  }
}