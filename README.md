# Deloitte Operations Dashboard

A high-density manufacturing operations dashboard built with Next.js, React 19, and Tailwind CSS. Provides real-time monitoring of KPIs, forecast charts, scheduling, and operations logging.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18 or higher |
| pnpm | v8 or higher |

Install pnpm if you don't have it:
```bash
npm install -g pnpm
```

---

## Getting Started

```bash
# 1. Clone or download the project
cd Deloitte_dashboard

# 2. Install dependencies
pnpm install

# 3. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload (Turbopack) |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server (requires build first) |
| `pnpm lint` | Run ESLint |

---

## Project Structure

```
Deloitte_dashboard/
│
├── app/                        # Next.js App Router
│   ├── globals.css             # Global styles and Tailwind CSS theme variables
│   ├── layout.tsx              # Root layout (fonts, metadata, viewport)
│   ├── page.tsx                # Root entry — redirects to /dashboard
│   │
│   └── (dashboard)/            # Route group — shared sidebar layout (no URL segment)
│       ├── layout.tsx          # Shell: Sidebar + main content area
│       ├── dashboard/
│       │   └── page.tsx        # /dashboard — KPI cards, forecast chart, operations log
│       ├── scheduling/
│       │   └── page.tsx        # /scheduling — Scheduling tool
│       ├── parameters/
│       │   └── page.tsx        # /parameters — Parameters setup
│       └── monthly-plan/
│           └── page.tsx        # /monthly-plan — Data ingestion / monthly plan
│
├── components/                 # React components
│   ├── sidebar.tsx             # Collapsible navigation sidebar
│   ├── dashboard-content.tsx   # Dashboard tab layout (KPIs + Chart + Table)
│   ├── kpi-cards.tsx           # KPI metric cards section
│   ├── forecast-chart.tsx      # Recharts-based forecast/throughput chart
│   ├── operations-table.tsx    # Filterable, paginated operations log table
│   ├── scheduling-content.tsx  # Scheduling tab content
│   ├── monthly-plan-content.tsx  # Monthly plan tab layout
│   ├── monthly-plan-section.tsx  # Monthly plan detail section
│   ├── parameters-content.tsx  # Parameters tab content
│   ├── theme-provider.tsx      # next-themes dark/light mode provider
│   │
│   └── ui/                     # shadcn/ui component library (auto-generated)
│       ├── button.tsx
│       ├── card.tsx
│       ├── table.tsx
│       ├── badge.tsx
│       ├── calendar.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       └── ... (50+ components)
│
├── hooks/                      # Custom React hooks
│   ├── use-mobile.ts           # Detects mobile viewport
│   └── use-toast.ts            # Toast notification state management
│
├── lib/                        # Utility functions
│   └── utils.ts                # cn() helper (clsx + tailwind-merge)
│
├── public/                     # Static assets
│   └── ...
│
├── styles/                     # Additional styles
│
├── next.config.mjs             # Next.js configuration
├── tailwind.config             # Tailwind CSS configuration (v4)
├── postcss.config.mjs          # PostCSS configuration
├── tsconfig.json               # TypeScript configuration
├── components.json             # shadcn/ui configuration
└── package.json                # Dependencies and scripts
```

---

## Tech Stack

| Layer          | Technology                                                                        |
|----------------|-----------------------------------------------------------------------------------|
| Framework      | [Next.js 16](https://nextjs.org/) (App Router)                                    |
| UI Library     | [React 19](https://react.dev/)                                                    |
| Styling        | [Tailwind CSS v4](https://tailwindcss.com/)                                       |
| Components     | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)       |
| Charts         | [Recharts](https://recharts.org/)                                                 |
| Forms          | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)         |
| Icons          | [Lucide React](https://lucide.dev/)                                               |
| Themes         | [next-themes](https://github.com/pacocoursey/next-themes)                         |
| Date Picker    | [React Day Picker](https://react-day-picker.js.org/)                              |
| Package Manager| [pnpm](https://pnpm.io/)                                                          |
| Language       | TypeScript 5                                                                      |

---

## Pages & Routes

| Page          | URL             | Description                                    |
|---------------|-----------------|------------------------------------------------|
| Dashboard     | `/dashboard`    | KPI cards, forecast chart, operations log      |
| Scheduling    | `/scheduling`   | Production scheduling tool                     |
| Parameters    | `/parameters`   | Configuration and parameter management         |
| Monthly Plan  | `/monthly-plan` | Data ingestion and monthly planning targets    |

---

## Notes

- All mock data is generated client-side using a seeded random number generator to prevent SSR/hydration mismatches.
- The UI uses Tailwind CSS v4 with CSS variable-based theming (see `app/globals.css`).
- shadcn/ui components live in `components/ui/` and should not be manually edited — use the shadcn CLI to add or update them.
