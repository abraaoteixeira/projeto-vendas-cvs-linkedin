# Milestone 1: Project Setup & Config Analysis

## Executive Summary
This document proposes the setup strategy, file configurations, and directory structure for the LinkedIn Profile Rebuilder SaaS MVP. We recommend a deterministic, manual configuration approach for Next.js, Tailwind CSS, shadcn/ui, and Firebase client SDK initialization to ensure maximum reliability and avoid interactive prompt hanging in automated agent environments.

---

## 1. Setup Strategy & Methodology
To initialize the project, there are two primary methods:
- **Interactive Initializers (`create-next-app` + `shadcn-ui init`)**: Often hangs in automated shell environments, prompt configurations are non-deterministic, and auto-generated boilerplate may conflict with the layout requirements.
- **Deterministic Manifest Writing (Recommended)**: The worker will write the manifest configuration files (`package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.js`, `postcss.config.js`, `components.json`) directly to the project root and then execute a single `npm install` command. This ensures 100% reliability, speed, and absolute layout alignment with the specification in `PROJECT.md`.

---

## 2. Proposed Folder Structure
Following the requirements in `PROJECT.md`, the repository must match the following directory layout:

```text
projeto-vendas-cvs-linkedin/
├── .agents/                    # Agent metadata (No source code or tests here)
├── .env.example                # Template for environment variables
├── .gitignore                  # Git ignore rules
├── components.json             # shadcn/ui configuration file
├── next.config.mjs             # Next.js configuration
├── package.json                # Dependency manifest
├── postcss.config.js           # PostCSS configuration
├── PROJECT.md                  # Project specification (existing)
├── tailwind.config.js          # Tailwind CSS configurations
├── tsconfig.json               # TypeScript compiler options
└── src/
    ├── app/                    # Next.js App Router (pages & API routes)
    │   ├── api/
    │   │   └── profile-rebuild/# Decoupled API endpoint (Milestone 4)
    │   ├── globals.css         # Tailwind and shadcn variables
    │   ├── layout.tsx          # App root layout template
    │   └── page.tsx            # Main Landing / Entry point
    ├── components/             # Shared UI & Page components (Milestone 3)
    │   └── ui/                 # Atomic shadcn UI components (button, dialog, etc.)
    └── lib/                    # Initialization & Helper utilities
        ├── firebase.ts         # Firebase Web SDK initialization
        └── utils.ts            # shadcn/ui class merger utility (cn helper)
```

---

## 3. Proposed Configuration Files

### `package.json`
Specifies a stable, tested bundle using Next.js 14.2.4 (React 18.3.x for optimal shadcn component compatibility) and Firebase client Web SDK.
```json
{
  "name": "linkedin-profile-rebuilder",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "firebase": "^10.12.2",
    "lucide-react": "^0.395.0",
    "next": "14.2.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^20.14.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5"
  }
}
```

### `tsconfig.json`
Ensures strict TypeScript compilation, enables module resolution for Next.js, and maps path aliases to `src/`.
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `next.config.mjs`
Next.js configuration using the modern ES module format.
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

### `tailwind.config.js`
Tailwind v3 configuration customized to support CSS variables and theme variables for shadcn/ui.
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### `postcss.config.js`
Standard PostCSS configuration file.
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### `components.json`
Configures shadcn/ui to use components under `src/components`, custom utilities inside `src/lib/utils`, and CSS variables.
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### `.gitignore`
Excludes dependency folders, environment files, build outputs, and editor artifacts.
```text
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

### `.env.example`
A template detailing required client-side configurations.
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## 4. Proposed Core Application Files

### `src/lib/utils.ts`
Utility function mapping `clsx` and `tailwind-merge` class concatenations.
```typescript
import { type ClassValue, clsx } from "clsx"
import { tailwindMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return tailwindMerge(clsx(inputs))
}
```

### `src/lib/firebase.ts`
Initializes the Firebase Client App, Firestore, and Storage. Safely handles hot reloading by checking existing instances.
```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
```

### `src/app/globals.css`
Declares Tailwind imports and registers shadcn theme variables.
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### `src/app/layout.tsx`
Basic layout containing default fonts and metadata configuration.
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LinkedIn Profile Rebuilder",
  description: "Transform and optimize your CV into an engaging LinkedIn profile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### `src/app/page.tsx`
Simple entry-level welcome page.
```typescript
import React from "react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-primary">
        LinkedIn Profile Rebuilder
      </h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-md">
        Upload your CV PDF, preview your rewritten layout, and export optimized copy for your profile.
      </p>
    </main>
  );
}
```

---

## 5. Implementer Action Guidelines (How to Setup)

We recommend the **Implementer** executes the following steps in sequence:

1. **Create directories**:
   Create the base directories `./src`, `./src/app`, `./src/components`, `./src/components/ui`, and `./src/lib`.
   
2. **Write configuration manifests**:
   Write the 8 config manifests proposed in section 3 directly to the root of the workspace.

3. **Write initial application files**:
   Write the 5 core application files proposed in section 4 directly to their respective paths under `src/`.

4. **Install dependencies**:
   Run the package installer from the project root:
   ```bash
   npm install
   ```

5. **Verify the configuration**:
   Run the build script to ensure there are no compilation or layout errors:
   ```bash
   npm run build
   ```
   This ensures that:
   - Next.js successfully compiles the pages.
   - Tailwind parses files in `src/` correctly.
   - TypeScript compiles strictly with aliases mapped to `@/*`.
