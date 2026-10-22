# AUMNex — Smart Campus Management System

AUMNex is a web-based smart campus management platform designed to bring student services, administrative workflows, attendance tracking, and AI-powered assistance into one application.

The platform provides two primary interfaces:

- **Admin Portal** — tools for managing student records, attendance, academic information, fees, notifications, and administrative workflows.
- **Student Portal** — access to attendance, results, fees, timetable, notifications, profile management, and student support features.

## Live Application

- **Production:** https://aumnex-02.vercel.app
- **GitHub Repository:** https://github.com/Kunal-06-V/aumnex-02

## Features

### Admin Portal

- Administrative dashboard
- Student management and individual student records
- Access requests and access management
- NFC-based attendance reader
- Attendance records and session history
- Attendance session start time, end time, and duration
- Attendance summaries and report exports
- Results and fees modules
- Timetable and notifications
- Reports and data integrity/audit pages
- AI advisor
- Admin profile, help, and settings
- Responsive navigation for mobile screens

### Student Portal

- Student dashboard
- Attendance and attendance history
- NFC attendance interface
- Results and fees
- Timetable and notifications
- Student profile and profile editing
- AI assistance and Ask AUMNex
- Help and settings
- SOS interface

The presence of a page does not necessarily mean every workflow is complete; feature availability should be verified in the deployed application.

### NFC Attendance and Performance

AUMNex includes an NFC attendance workflow backed by a server-side API.

- NFC reader integration with attendance processing
- Server-side authentication and attendance handling
- Attendance session history and duration tracking
- Performance instrumentation for measuring API processing time
- Real-device testing with an NFC-capable Android phone

**Recorded performance improvement:** API processing time decreased from approximately **5.47 seconds to 0.33 seconds** in recorded tests, an approximate **94% reduction**. Actual latency may vary with network conditions, Firebase operations, device behavior, and server load.

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Application framework and API routes |
| React 19 | User interface |
| JavaScript | Application logic |
| Tailwind CSS 4 | Styling and responsive layouts |
| Firebase Authentication | Authentication integration |
| Cloud Firestore | Database and application data |
| Firebase Admin SDK | Server-side Firebase operations |
| Google GenAI | AI-powered functionality |
| Vercel | Application deployment |
| jsPDF and jsPDF AutoTable | PDF/report generation |
| XLSX | Spreadsheet-related functionality |
| Recharts | Data visualization |
| Lucide React | Icons |

## Application Structure

```text
src/
├── app/
│   ├── admin/          # Admin Portal pages
│   ├── student/        # Student Portal pages
│   ├── api/
│   │   ├── ai/         # AI API endpoints
│   │   ├── auth/       # Registration endpoint
│   │   └── nfc/        # NFC attendance endpoint
│   └── register/       # Registration page
├── components/         # Shared UI components
└── lib/                # Shared libraries and Firebase utilities
```

## Getting Started

### Prerequisites

- Node.js and npm
- A Firebase project configured for the application
- Appropriate credentials for the required server-side integrations

### 1. Clone the repository

```bash
git clone https://github.com/Kunal-06-V/aumnex-02.git
cd aumnex-02
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root and configure the required server-side variables:

```dotenv
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
GEMINI_API_KEY=
```

Use the values from your own Firebase service account and Google AI configuration. The private key must