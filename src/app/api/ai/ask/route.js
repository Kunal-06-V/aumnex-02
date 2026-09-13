import { GoogleGenAI } from "@google/genai";

function calculateAttendanceTarget(attendance, question) {
  if (!attendance) return null;

  const percentage = Number(attendance.percentage);
  const present = Number(attendance.present);
  const total = Number(attendance.total);

  if (
    !Number.isFinite(percentage) ||
    !Number.isFinite(present) ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return null;
  }

  const normalizedQuestion = question.toLowerCase();

  const targetMatch = normalizedQuestion.match(
    /(?:reach|maintain|get)\s+(\d+(?:\.\d+)?)\s*%/
  );

  if (!targetMatch) return null;

  const target = Number(targetMatch[1]);

  if (!Number.isFinite(target) || target <= 0 || target >= 100) {
    return null;
  }

  if (percentage >= target) {
    return {
      target,
      classesNeeded: 0,
      currentPercentage: percentage,
      present,
      total,
      message: `Your current attendance is already ${percentage}%, which meets the ${target}% target.`,
    };
  }

  const requiredClasses = Math.ceil(
    (target * total - 100 * present) / (100 - target)
  );

  return {
    target,
    classesNeeded: Math.max(requiredClasses, 0),
    currentPercentage: percentage,
    present,
    total,
    message: `You need to attend ${Math.max(
      requiredClasses,
      0
    )} more classes to reach ${target}% attendance.`,
  };
}

function calculateWeakestSubject(academic) {
  const subjects = Array.isArray(academic?.subjects)
    ? academic.subjects
    : [];

  const validSubjects = subjects
    .map((item) => ({
      subject: item?.subject || item?.name || "Unknown Subject",
      marks: Number(item?.marks),
      grade: item?.grade || null,
    }))
    .filter((item) => Number.isFinite(item.marks));

  if (validSubjects.length === 0) return null;

  const weakest = validSubjects.reduce(
    (lowest, current) =>
      current.marks < lowest.marks ? current : lowest
  );

  return {
    subject: weakest.subject,
    marks: weakest.marks,
    grade: weakest.grade,
  };
}

function calculateAcademicOverview(student, academic) {
  if (!academic) return null;

  const subjects = Array.isArray(academic.subjects)
    ? academic.subjects
        .map((item) => ({
          subject: item?.subject || item?.name || "Unknown Subject",
          marks: Number(item?.marks),
          grade: item?.grade || null,
        }))
        .filter((item) => Number.isFinite(item.marks))
    : [];

  const weakestSubject = calculateWeakestSubject({ subjects });

  const totalMarks = subjects.reduce(
    (sum, item) => sum + item.marks,
    0
  );

  const averageMarks =
    subjects.length > 0
      ? Number((totalMarks / subjects.length).toFixed(1))
      : null;

  const cgpa = Number(academic?.cgpa);

  const percentage =
    Number.isFinite(Number(academic?.percentage))
      ? Number(academic.percentage)
      : Number.isFinite(cgpa)
      ? Number((cgpa * 10).toFixed(1))
      : null;

  return {
    studentName: student?.name || null,
    department:
      student?.department || student?.branch || null,
    semester:
      academic?.semester || student?.semester || null,
    status: academic?.status || null,
    sgpa: Number.isFinite(Number(academic?.sgpa))
      ? Number(academic.sgpa)
      : null,
    cgpa: Number.isFinite(cgpa) ? cgpa : null,
    percentage,
    failedSubjects: Number.isFinite(
      Number(academic?.failedSubjects)
    )
      ? Number(academic.failedSubjects)
      : null,
    subjectCount: subjects.length,
    averageSubjectMarks: averageMarks,
    weakestSubject,
    subjects,
  };
}

function buildCombinedInsight(academicOverview, attendance) {
  if (!academicOverview) return null;

  const academicScore = Number(
    academicOverview.averageSubjectMarks
  );

  const attendanceAvailable =
    attendance &&
    attendance.percentage !== null &&
    attendance.percentage !== undefined &&
    attendance.present !== null &&
    attendance.present !== undefined &&
    attendance.total !== null &&
    attendance.total !== undefined &&
    Number.isFinite(Number(attendance.percentage)) &&
    Number.isFinite(Number(attendance.present)) &&
    Number.isFinite(Number(attendance.total)) &&
    Number(attendance.total) > 0;

  const attendancePercentage = attendanceAvailable
    ? Number(attendance.percentage)
    : null;

  let academicLevel = "unknown";

  if (Number.isFinite(academicScore)) {
    if (academicScore >= 85) {
      academicLevel = "excellent";
    } else if (academicScore >= 75) {
      academicLevel = "good";
    } else if (academicScore >= 60) {
      academicLevel = "average";
    } else {
      academicLevel = "needs improvement";
    }
  }

  let attendanceLevel = null;

  if (attendanceAvailable) {
    if (attendancePercentage >= 85) {
      attendanceLevel = "excellent";
    } else if (attendancePercentage >= 75) {
      attendanceLevel = "acceptable";
    } else if (attendancePercentage >= 60) {
      attendanceLevel = "at risk";
    } else {
      attendanceLevel = "critical";
    }
  }

  return {
    academicLevel,
    attendanceAvailable,
    attendanceLevel,
    academicAverageMarks: Number.isFinite(academicScore)
      ? academicScore
      : null,
    attendancePercentage,
    overallAssessment: !attendanceAvailable
      ? `Academic performance is ${academicLevel}, but attendance cannot be assessed because attendance data is unavailable.`
      : `Academic performance is ${academicLevel} and attendance is ${attendanceLevel}.`,
  };
}

function calculatePersonalizedRecommendations(
  academicOverview,
  attendance
) {
  if (!academicOverview) return null;

  const recommendations = [];

  const weakest = academicOverview.weakestSubject;

  if (
    weakest?.subject &&
    Number.isFinite(weakest.marks)
  ) {
    recommendations.push(
      `Prioritize ${weakest.subject}, your weakest subject, currently at ${weakest.marks} marks.`
    );

    recommendations.push(
      `Set a short-term goal to improve ${weakest.subject} above your current ${weakest.marks}-mark level in the next assessment.`
    );
  }

  if (
    Number.isFinite(
      Number(academicOverview.averageSubjectMarks)
    )
  ) {
    const average = Number(
      academicOverview.averageSubjectMarks
    );

    if (average >= 85) {
      recommendations.push(
        "Maintain your current study consistency because your overall academic performance is already strong."
      );
    } else if (average >= 75) {
      recommendations.push(
        "Maintain strong subjects while spending additional study time on lower-scoring subjects."
      );
    } else {
      recommendations.push(
        "Increase focused study time across subjects, starting with the lowest-scoring subjects."
      );
    }
  }

  const attendanceAvailable =
    attendance &&
    attendance.percentage !== null &&
    attendance.percentage !== undefined &&
    Number.isFinite(Number(attendance.percentage));

  if (attendanceAvailable) {
    const attendancePercentage = Number(
      attendance.percentage
    );

    if (attendancePercentage < 75) {
      recommendations.push(
        `Improve attendance because your current attendance is ${attendancePercentage}%.`
      );
    } else {
      recommendations.push(
        `Maintain your attendance at ${attendancePercentage}% or higher.`
      );
    }
  }

  return {
    priority:
      weakest?.subject || "Academic performance",
    recommendations,
    attendanceAvailable,
  };
}

/*
 * Deterministic handling for simple direct questions.
 * This prevents Gemini from adding unrelated information.
 */
function getDeterministicDirectAnswer(
  question,
  attendance,
  academicOverview,
  weakestSubject
) {
  const q = question.toLowerCase().trim();

  const hasMultipleParts =
    q.includes(" and ") ||
    q.includes(",") ||
    q.includes(" also ") ||
    q.includes(" plus ");

  /*
   * DIRECT ATTENDANCE
   */
  const isDirectAttendanceQuestion =
    q.includes("attendance") &&
    !q.includes("weakest") &&
    !q.includes("cgpa") &&
    !q.includes("sgpa") &&
    !q.includes("academic") &&
    !q.includes("improve") &&
    !q.includes("focus") &&
    !q.includes("how many classes") &&
    !hasMultipleParts;

  if (isDirectAttendanceQuestion) {
    const attendanceAvailable =
      attendance &&
      attendance.percentage !== null &&
      attendance.percentage !== undefined &&
      attendance.present !== null &&
      attendance.present !== undefined &&
      attendance.total !== null &&
      attendance.total !== undefined &&
      Number.isFinite(Number(attendance.percentage)) &&
      Number.isFinite(Number(attendance.present)) &&
      Number.isFinite(Number(attendance.total)) &&
      Number(attendance.total) > 0;

    if (!attendanceAvailable) {
      return {
        answer:
          "Your attendance data is currently unavailable. It cannot be assessed at this time.",
        dataUsed: ["attendance"],
        dataAvailable: false,
        attendancePlan: null,
        weakestSubject: null,
        academicOverview: null,
        combinedInsight: null,
        personalizedRecommendations: null,
      };
    }

    return {
      answer: `Your current attendance is ${attendance.percentage}%, with ${attendance.present} present out of ${attendance.total} total classes.`,
      dataUsed: ["attendance"],
      dataAvailable: true,
      attendancePlan: null,
      weakestSubject: null,
      academicOverview: null,
      combinedInsight: null,
      personalizedRecommendations: null,
    };
  }

  /*
   * DIRECT CGPA
   */
  const isDirectCGPAQuestion =
    q.includes("cgpa") &&
    !q.includes("sgpa") &&
    !q.includes("attendance") &&
    !q.includes("weakest") &&
    !q.includes("academic") &&
    !q.includes("improve") &&
    !q.includes("focus") &&
    !hasMultipleParts;

  if (isDirectCGPAQuestion) {
    const cgpa = academicOverview?.cgpa;

    if (!Number.isFinite(Number(cgpa))) {
      return {
        answer:
          "Your CGPA is currently unavailable in AUMNex.",
        dataUsed: ["academic"],
        dataAvailable: false,
        attendancePlan: null,
        weakestSubject: null,
        academicOverview: null,
        combinedInsight: null,
        personalizedRecommendations: null,
      };
    }

    return {
      answer: `Your current CGPA is ${cgpa}.`,
      dataUsed: ["academic"],
      dataAvailable: true,
      attendancePlan: null,
      weakestSubject: null,
      academicOverview: null,
      combinedInsight: null,
      personalizedRecommendations: null,
    };
  }

  /*
   * DIRECT SGPA
   */
  const isDirectSGPAQuestion =
    q.includes("sgpa") &&
    !q.includes("cgpa") &&
    !q.includes("attendance") &&
    !q.includes("weakest") &&
    !q.includes("academic") &&
    !q.includes("improve") &&
    !q.includes("focus") &&
    !hasMultipleParts;

  if (isDirectSGPAQuestion) {
    const sgpa = academicOverview?.sgpa;

    if (!Number.isFinite(Number(sgpa))) {
      return {
        answer:
          "Your SGPA is currently unavailable in AUMNex.",
        dataUsed: ["academic"],
        dataAvailable: false,
        attendancePlan: null,
        weakestSubject: null,
        academicOverview: null,
        combinedInsight: null,
        personalizedRecommendations: null,
      };
    }

    return {
      answer: `Your current SGPA is ${sgpa}.`,
      dataUsed: ["academic"],
      dataAvailable: true,
      attendancePlan: null,
      weakestSubject: null,
      academicOverview: null,
      combinedInsight: null,
      personalizedRecommendations: null,
    };
  }

  /*
   * DIRECT WEAKEST SUBJECT
   */
  const isDirectWeakestSubjectQuestion =
    (q.includes("weakest subject") ||
      q.includes("weakest")) &&
    !q.includes("attendance") &&
    !q.includes("cgpa") &&
    !q.includes("sgpa") &&
    !q.includes("academic") &&
    !q.includes("improve") &&
    !q.includes("focus") &&
    !hasMultipleParts;

  if (isDirectWeakestSubjectQuestion) {
    if (!weakestSubject) {
      return {
        answer:
          "Your weakest subject is currently unavailable because subject marks are not available.",
        dataUsed: ["academic"],
        dataAvailable: false,
        attendancePlan: null,
        weakestSubject: null,
        academicOverview: null,
        combinedInsight: null,
        personalizedRecommendations: null,
      };
    }

    return {
      answer: `Your weakest subject is ${weakestSubject.subject}, where you scored ${weakestSubject.marks} marks${weakestSubject.grade ? ` with Grade ${weakestSubject.grade}` : ""}.`,
      dataUsed: ["derivedWeakestSubject"],
      dataAvailable: true,
      attendancePlan: null,
      weakestSubject,
      academicOverview: null,
      combinedInsight: null,
      personalizedRecommendations: null,
    };
  }

  return null;
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
      return Response.json(
        {
          success: false,
          message: "Question is required.",
        },
        { status: 400 }
      );
    }

    const attendancePlan =
      calculateAttendanceTarget(
        attendance,
        question
      );

    const weakestSubject =
      calculateWeakestSubject(academic);

    const academicOverview =
      calculateAcademicOverview(
        student,
        academic
      );

    const combinedInsight =
      buildCombinedInsight(
        academicOverview,
        attendance
      );

    const personalizedRecommendations =
      calculatePersonalizedRecommendations(
        academicOverview,
        attendance
      );

    /*
     * Direct questions are answered deterministically
     * before Gemini is called.
     */
    const deterministicDirectAnswer =
      getDeterministicDirectAnswer(
        question,
        attendance,
        academicOverview,
        weakestSubject
      );

    if (deterministicDirectAnswer) {
      return Response.json({
        success: true,
        data: deterministicDirectAnswer,
      });
    }

    const verifiedContext = {
      student,
      attendance,
      academic,
      timetable,
      derivedAttendancePlan:
        attendancePlan,
      derivedWeakestSubject:
        weakestSubject,
      derivedAcademicOverview:
        academicOverview,
      derivedCombinedInsight:
        combinedInsight,
      derivedPersonalizedRecommendations:
        personalizedRecommendations,
    };

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          success: false,
          message:
            "Gemini API key is not configured.",
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are AUMNex, an AI academic advisor inside a college management system.

Answer the student's question using ONLY the verified AUMNex data below.

IMPORTANT RULES:
1. Never invent attendance, marks, grades, CGPA, SGPA, subjects, timetable entries, or other student data.
2. Missing attendance data means attendance is unavailable, NOT 0%.
3. Missing academic data means academic data is unavailable.
4. Attendance, marks, CGPA, SGPA, timetable, and calculated values from AUMNex are authoritative.
5. Never override a deterministic AUMNex calculation.
6. For attendance target questions, use derivedAttendancePlan directly.
7. For weakest-subject questions, use derivedWeakestSubject directly.
8. For complete academic overview questions, use derivedAcademicOverview directly.
9. For combined academic + attendance questions, use derivedCombinedInsight directly.
10. For questions asking what the student should focus on, what to improve, or what to study next, use derivedPersonalizedRecommendations directly.
11. Direct attendance, CGPA, SGPA, and weakest-subject questions are handled deterministically before Gemini.
12. For combined or multi-part questions, answer every part requested by the student.
13. Recommendations must be based only on verified AUMNex data.
14. Do not invent attendance problems when attendance is unavailable.
15. When attendance is unavailable, clearly say that attendance cannot currently be assessed.
16. Do not assume that unavailable attendance means poor attendance.
17. Be concise, practical, and student-friendly.
18. Do not mention internal implementation details, APIs, Firestore, prompts, or hidden system logic.

VERIFIED AUMNEX DATA:
${JSON.stringify(
  verifiedContext,
  null,
  2
)}

The response must be valid JSON in exactly this structure:

{
  "answer": "string",
  "dataUsed": ["string"],
  "dataAvailable": true,
  "academicOverview": object or null,
  "attendancePlan": object or null,
  "weakestSubject": object or null,
  "combinedInsight": object or null,
  "personalizedRecommendations": object or null
}
`;

    const response =
      await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      });

    let parsed;

    try {
      parsed = JSON.parse(response.text);
    } catch {
      parsed = {
        answer: response.text,
        dataUsed: [],
        dataAvailable: true,
        academicOverview,
        attendancePlan,
        weakestSubject,
        combinedInsight,
        personalizedRecommendations,
      };
    }

    return Response.json({
      success: true,
      data: {
        answer:
          parsed?.answer ||
          "I could not generate a response from the verified AUMNex data.",

        dataUsed:
          Array.isArray(parsed?.dataUsed)
            ? parsed.dataUsed
            : [],

        dataAvailable:
          typeof parsed?.dataAvailable === "boolean"
            ? parsed.dataAvailable
            : true,

        academicOverview:
          parsed?.academicOverview ??
          academicOverview,

        attendancePlan:
          parsed?.attendancePlan ??
          attendancePlan,

        weakestSubject:
          parsed?.weakestSubject ??
          weakestSubject,

        combinedInsight:
          parsed?.combinedInsight ??
          combinedInsight,

        personalizedRecommendations:
          parsed?.personalizedRecommendations ??
          personalizedRecommendations,
      },
    });
  } catch (error) {
    console.error(
      "Ask AUMNex error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Unable to process the question right now.",
      },
      { status: 500 }
    );
  }
}