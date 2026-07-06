# Crimson Cup BD ERP - Setup Guide & Neon DB Migration

## App Setup (Post-Export)

This application is built with React, Vite, and Tailwind CSS on the frontend, and an Express.js backend.
It uses Drizzle ORM to interface with a PostgreSQL database.

### 1. Installation

After unzipping your exported project, navigate to the project directory and install the dependencies:
```bash
npm install
```

### 2. Setting Up Neon PostgreSQL Database

To get the application working locally with a real database exactly like in the preview environment, we recommend [Neon Serverless Postgres](https://neon.tech).

1. Go to [Neon.tech](https://neon.tech/) and create a free account.
2. Create a new Project (name it `crimson-cup-erp` or similar).
3. Once the database is provisioned, you will be shown a **Connection String** (it looks like `postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require`).
4. Copy this Connection String.

### 3. Environment Variables

Create a `.env` file in the root of your project directory and add your credentials:

```env
# Database connection string from Neon
DATABASE_URL=postgresql://your_neon_user:your_neon_password@your_neon_endpoint.neon.tech/neondb?sslmode=require

# Gemini API Key (Required for AI Insights)
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Database Schema and Seeding

Now that your local `.env` is configured to point to your new Neon database, you need to push the table schemas and populate it with the operational data.

1. **Push the Schema**: This creates the necessary tables (`users`, `branches`, `inventory`, `attendance`, `roster`, `payroll`) in your Neon DB.
   ```bash
   npx drizzle-kit push --config src/db/drizzle.config.ts
   ```

2. **Seed the Database**: Run the seed script to populate the database with a massive dataset, including multiple branches, managers, supervisors, over 40 employees, dynamic inventory stock levels, and historical 7-day attendance and roster data to give you a real operational feel.
   ```bash
   npx tsx src/db/seed.ts
   ```

### 5. Start the Application

Start the development server (which spins up both backend API and frontend Vite server on port 3000):
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## AI LLM API Key Setup (Gemini Pro)

The "AI Insights" module relies on the `@google/genai` SDK and the `gemini-2.5-pro` model to answer queries about the database dynamically. 

### How to get a free API Key:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **Create API Key**.
4. Copy the generated key.
5. Paste it into your `.env` file as `GEMINI_API_KEY`.

> Note: Gemini offers a generous free tier that is perfectly suitable for this application's AI module. The Express server safely isolates this key from the frontend client.
