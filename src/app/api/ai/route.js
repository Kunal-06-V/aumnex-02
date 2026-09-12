import { NextResponse } from "next/server";

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      studentName,
      attendancePercentage,
      academicScore,
      recentAttendance,
      weakestSubject,
      weakestSubjectAttendance,
    } = body;

    if (!studentName) {
      return NextResponse.json(
        {
          success: false,
          message: "Student name is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Attendance may be unavailable.
     * null/undefined must stay "unavailable",
     * never become 0.
     */
    const hasAttendanceScore =
      attendancePercentage !== null &&
      attendancePercentage !== undefined &&
      Number.isFinite(Number(attendancePercentage));

    const attendance = hasAttendanceScore
      ? Number(attendancePercentage)
      : null;

    /*
     * Academic score may also be unavailable.
     */
    const hasAcademicScore =
      academicScore !== null &&
      academicScore !== undefined &&
      Number.isFinite(Number(academicScore));

    const academic = hasAcademicScore
      ? Number(academicScore)
      : null;

    /*
     * AUMNex calculates the authoritative risk.
     * Missing data does not count as zero.
     */
    let riskLevel = "LOW";

    if (
      (attendance !== null && attendance < 60) ||
      (academic !== null && academic < 50)
    ) {
      riskLevel = "HIGH";
    } else if (
      (attendance !== null && attendance < 75) ||
      (academic !== null && academic < 65)
    ) {
      riskLevel = "MEDIUM";
    }

    const studentContext = {
      studentName,

      attendancePercentage: attendance,

      attendanceDataAvailable: hasAttendanceScore,

      academicScore: academic,

      academicDataAvailable: hasAcademicScore,

      recentAttendance:
        recentAttendance || "Not available",

      weakestSubject:
        weakestSubject || "Not available",

      weakestSubjectAttendance:
        weakestSubjectAttendance ?? "Not available",

      calculatedRiskLevel: riskLevel,
    };

    const prompt = `
You are AUMNex Student Intelligence, an academic
decision-support assistant.

Analyze the verified student information below.

${JSON.stringify(studentContext, null, 2)}

Rules:

1. Never invent facts.
2. Never change supplied numerical values.
3. AUMNex calculates the authoritative risk level.
4. Missing academic data means unavailable, NOT zero.
5. Missing attendance data means unavailable, NOT zero.
6. Never describe unavailable attendance as 0%.
7. Never claim a student has poor attendance when attendance data is unavailable.
8. Never claim a student is academically weak when academic data is unavailable.
9. Use only the metrics actually provided.
10. Give practical, concise recommendations.
11. Do not provide medical or high-stakes advice.

When attendanceDataAvailable is false:
- Explicitly say attendance data is unavailable.
- Do not calculate or imply an attendance percentage.

When academicDataAvailable is false:
- Explicitly say academic data is unavailable.
- Do not calculate or imply an academic percentage.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: {
              type: Type.STRING,
            },

            summary: {
              type: Type.STRING,
            },

            concerns: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },

            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },
          },

          required: [
            "riskLevel",
            "summary",
            "concerns",
            "recommendations",
          ],
        },
      },
    });

    const rawText = response.text?.trim();

    if (!rawText) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    let aiResult;

    try {
      aiResult = JSON.parse(rawText);
    } catch (parseError) {
      console.error(
        "AI JSON parse error:",
        parseError
      );

      console.error(
        "Raw Gemini response:",
        rawText
      );

      throw new Error(
        "Invalid AI response format."
      );
    }

    /*
     * AUMNex remains authoritative.
     * Gemini cannot override the calculated risk.
     */
    aiResult.riskLevel = riskLevel;

    return NextResponse.json(
      {
        success: true,

        data: {
          ...aiResult,

          student: studentName,

          calculatedRiskLevel: riskLevel,

          attendancePercentage: attendance,

          academicScore: academic,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "AUMNex AI API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "AUMNex AI request failed.",
      },
      { status: 500 }
    );
  }
}