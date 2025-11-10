# Bills Tracker

A simple and minimal web application to track your monthly bills, payment dates, and notes. You can also upload attachments like bill PDFs or payment confirmations.

## Features

*   Track your recurring bills with details like bill type, amount, and payment date.
*   Add notes to your bills for extra details.
*   Upload file attachments (images or PDFs) for each bill.
*   Secure authentication using Supabase.
*   Clean, responsive, and minimal user interface.

## Tech Stack

*   **Framework:** [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Backend & Database:** [Supabase](https://supabase.com/) (Authentication, Postgres Database, Storage)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Routing:** [React Router](https://reactrouter.com/)

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v20.x or higher recommended)
*   [npm](https://www.npmjs.com/)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd bills-tracker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Supabase project credentials. You can find these in your Supabase project's dashboard under `Settings` > `API`.

    ```env
    VITE_SUPABASE_URL=your-supabase-project-url
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

    > **Note:** This application relies on Supabase's Row Level Security (RLS) to be properly configured to secure user data.

### Running the Application

*   **To run the development server:**
    The application will be available at `http://localhost:5173`.
    ```bash
    npm run dev
    ```

*   **To build for production:**
    The output will be in the `dist/` directory.
    ```bash
    npm run build
    ```

*   **To run the linter:**
    ```bash
    npm run lint
    ```

## Profiling & Debugging Tips

*   **React Profiler:** Use the React DevTools Profiler to record interactions (adding/editing bills) and confirm render counts and timings before/after code changes.
*   **Network Monitoring:** In the browser Network tab, filter for `bills` or `bill_attachments` to ensure each action issues exactly one Supabase request.
*   **Console Timing:** When investigating a slowdown, temporarily wrap service calls in `console.time`/`console.timeEnd` to measure durations—just remove these logs before committing.

## Project Structure

The source code is located in the `src/` directory and is organized as follows:

*   `src/components/`: Reusable React components.
*   `src/contexts/`: React context for global state (e.g., `AuthContext`).
*   `src/hooks/`: Custom hooks for data fetching and business logic.
*   `src/lib/`: Supabase client initialization.
*   `src/pages/`: Top-level page components.
*   `src/types/`: TypeScript type definitions.
