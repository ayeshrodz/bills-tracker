# Bills Tracker

A simple and minimal web application to track your monthly bills, payment dates, and notes. You can also upload attachments like bill PDFs or payment confirmations.

## Features

*   Track your recurring bills with details like bill type, amount, and payment date.
*   Filter bills by category, date, or amount and page through large histories.
*   Add notes to your bills for extra details.
*   Optimistic add/edit/delete flows keep the UI responsive even on slower networks.
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

### Environment Variables

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
# Optional: override the storage bucket (defaults to bill-attachments)
VITE_SUPABASE_BUCKET=bill-attachments
```

> **Note:** The app validates these keys at startup and relies on Supabase Row Level Security (RLS) policies for data privacy.

### Application Config

Non-sensitive defaults (Supabase bucket name, signed URL TTL, toast duration, etc.) live in [`config/app.config.json`](config/app.config.json). Feel free to adjust those values per environment while keeping secrets in `.env`.

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

## Filtering & Pagination

*   The bills grid loads 25 records lazily; scroll to the bottom (or press “Load more”) to fetch the next page.
*   Filters (category, billing month/year, payment date range, amount range) live between the summary cards and the grid. Click “Apply filters” to refresh the list or “Reset” to clear.
*   The filter panel remembers whether you last left it open or closed and animates open/closed for a smoother UX.
*   Summary cards reflect the full filtered dataset thanks to server-side aggregates, while the footer shows how many results are currently displayed out of the total.

## Authentication Flow

*   All Supabase mutations call a shared `requireSession` helper; if a token expires the app automatically signs the user out and shows a toast prompting re-authentication.
*   Protected routes remember the original URL (`/bills/:id`, query string included) and redirect back to it after the user signs in again.

## Supabase Setup

Refer to [`SUPABASE.md`](SUPABASE.md) for the required tables, storage bucket, and RLS policies. The document includes ready-to-run SQL snippets plus notes on seeding default categories.

## Project Structure

The source code is located in the `src/` directory and is organized as follows:

*   `src/components/`: Reusable React components.
*   `src/contexts/`: React context for global state (e.g., `AuthContext`).
*   `src/hooks/`: Custom hooks for data fetching and business logic.
*   `src/lib/`: Supabase client initialization.
*   `src/pages/`: Top-level page components.
*   `src/types/`: TypeScript type definitions.
