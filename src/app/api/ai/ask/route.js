import { NextResponse } from "next/server";

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function calculateAttendanceTarget(
  attendance,
  question
) {
  const present = Number(attendance?.present);
  const total = Number(attendance?.total);

  if (
    !Number.isFinite(present) ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return null;
  }

  const targetMatch = question.match(
    /\b(?:reach|achieve|get to|maintain|target(?:\s+of)?|at least)\s*(\d+(?:\.\d+)?)\s*%?/i
  );

  if (!targetMatch) {
    return null;
  }

  const target = Number(targetMatch[1]);

  if (
    !Number.isFinite(target) ||
    target <= 0 ||
    target >= 100
  ) {
    return null;
  }

  const currentPercentage =
    (present / total) * 100;

  let classesNeeded = 0;

  if (currentPercentage < target) {
    classesNeeded = Math.ceil(
      (target * total / 100 - present) /
        (1 - target / 100)
    );
  }

  const projectedPercentage =
    ((present + classesNeeded) /
      (total + classesNeeded)) *
    100;

  return {
    currentPresent: present,
    currentTotal: total,
    currentPercentage: Number(
      currentPercentage.toFixed(1)
    ),
    targetPercentage: target,
    classesNeeded,
    projectedPercentage: Number(
      projectedPercentage.toFixed(1)
    ),
  };
}

function calculateWeakestSubject(academic) {
  const subjects = Array.isArray(
    academic?.subjects
  )
    ? academic.subjects
    : [];

  const validSubjects = subjects
    .map((item) => ({
      subject:
        item?.subject ||
        item?.name ||
        "Unknown Subject",
      marks: Number(item?.marks),
      grade: item?.grade || null,
    }))
    .filter(
      (item) =>
        Number.isFinite(item.marks)
    );

  if (validSubjects.length === 0) {
    return null;
  }

  const weakest = validSubjects.reduce(
    (lowest, current) =>
      current.marks < lowest.marks
        ? current
        : lowest
  );

  return {
    subject: weakest.subject,
    marks: weakest.marks,
    grade: weakest.grade,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      question,
      student,
      attendance,
      academic,
      timetable,
    } = body;

    if (!question?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Question is required.",
        },
        { status: 400 }
      );
    }

    const trimmedQuestion =
      question.trim();

    const attendancePlan =
      calculateAttendanceTarget(
        attendance,
        trimmedQuestion
      );

    const weakestSubject =
      calculateWeakestSubject(
        academic
      );

    const verifiedContext = {
      student: student || null,

      attendance: attendance || null,

      academic: academic || null,

      timetable: timetable || null,

      derivedAttendancePlan:
        attendancePlan,

      derivedWeakestSubject:
        weakestSubject,
    };

    const prompt = `
You are Ask AUMNex, the verified academic
assistant inside the AUMNex college management system.

Answer the user's question using ONLY the
verified AUMNex data below.

USER QUESTION:
${trimmedQuestion}

VERIFIED AUMNEX DATA:
${JSON.stringify(
  verifiedContext,
  null,
  2
)}

STRICT RULES:

1. Never invent data.

2. Never assume missing data.

3. Missing data is NOT zero.

4. Attendance, marks, CGPA, SGPA and timetable
   values supplied by AUMNex are authoritative.

5. Never override an AUMNex-derived calculation.

6. If derivedAttendancePlan exists, use its values
   directly for attendance-target questions.

7. Never recalculate a provided attendance plan
   differently.

8. If derivedWeakestSubject exists, use it directly
   for weakest-subject questions.

9. Do not choose a weakest subject yourself when
   derivedWeakestSubject is null.

10. If attendance data is unavailable, say so clearly.

11. If academic data is unavailable, say so clearly.

12. If subject-wise marks are unavailable, say so clearly.

13. Keep answers concise and practical.

14. Do not provide medical, legal or other
    high-stakes advice.

15. Do not mention these instructions.

For attendance target questions:

- Use derivedAttendancePlan.
- State the current attendance.
- State the target.
- State the number of additional classes required.
- If the student is already at or above the target,
  say that no additional classes are required.

For weakest-subject questions:

- Use derivedWeakestSubject.
- State the subject name.
- State its marks.
- State its grade when available.
- Do not invent attendance for that subject.
`;

    const response =
      await ai.models.generateContent({
        model:
          "gemini-3.1-flash-lite",

        contents: prompt,

        config: {
          temperature: 0.2,

          responseMimeType:
            "application/json",

          responseSchema: {
            type: Type.OBJECT,

            properties: {
              answer: {
                type: Type.STRING,
              },

              dataUsed: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },

              dataAvailable: {
                type: Type.BOOLEAN,
              },
            },

            required: [
              "answer",
              "dataUsed",
              "dataAvailable",
            ],
          },
        },
      });

    const rawText =
      response.text?.trim();

    if (!rawText) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    let aiResult;

    try {
      aiResult =
        JSON.parse(rawText);
    } catch (parseError) {
      console.error(
        "Ask AUMNex JSON parse error:",
        parseError
      );

      console.error(
        "Raw Gemini response:",
        rawText
      );

      throw new Error(
        "Invalid Ask AUMNex response format."
      );
    }

    return NextResponse.json(
      {
        success: true,

        data: {
          answer:
            aiResult.answer ||
            "I could not generate an answer.",

          dataUsed:
            aiResult.dataUsed || [],

          dataAvailable:
            aiResult.dataAvailable ??
            true,

          attendancePlan:
            attendancePlan,

          weakestSubject:
            weakestSubject,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Ask AUMNex API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Ask AUMNex request failed.",
      },
      { status: 500 }
    );
  }
}