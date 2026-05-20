# Febreeze Clean - Domestic Worker Platform

## Overview

Febreeze Clean is a mobile-first Progressive Web App (PWA) designed to connect informal domestic workers (primarily cleaners) with employers in South Africa. The platform focuses on trust, safety, and dignity for both workers and employers, aiming to replace informal street-corner hiring with a reliable, verified system.

The application supports multiple South African languages (English, isiZulu, Sesotho, Afrikaans) and is optimized for low-end Android devices with minimal data usage.

## Scope-Based Pricing Model

Febreeze Clean uses a **scope-based pricing model** where employers describe their needs and receive a fixed price — they never choose workers, hours, or negotiate.

### Booking Flow
1. **House Size** — Small, Medium, Large
2. **Tasks** — General Cleaning, Ironing, Laundry, Windows, Deep Clean
3. **Availability Window** — Morning, Afternoon, Flexible
4. **Date** — Today, Tomorrow, This Week, Next Week
5. **Area** — Major South African cities
6. **Payment Method** — Cash, EFT (bank transfer), Card (speedpoint machine)
7. **Review & Confirm** — Fixed price shown, calculated server-side

### Authentication
- Username/password login
- Google login (via OAuth)
- User roles: worker, employer, admin

### Pricing Formula
```
Price = basePrice × houseSizeMultiplier × sum(taskWeights)
Worker Payout = Price × workerPayoutPercent
```

### Security
- Price is always calculated server-side using admin-configured pricing rules
- Client-provided prices are rejected/ignored
- Enum validation for house sizes, tasks, and availability windows

### Trust System
- **Worker Ratings** — Visible to employers and admin
- **Employer Reliability Score** — Hidden from employers, shown to workers as trust indicator
- **Verification Badges** — ID verified, background checked, trained workers

## Tech Stack

### Frontend
- React 18 with TypeScript
- Wouter (routing)
- TanStack React Query (server state)
- shadcn/ui + Radix UI (components)
- Tailwind CSS (styling)
- Vite (build tool)

### Backend
- Node.js with Express 5
- TypeScript with ES modules
- RESTful JSON API under `/api/*`

### Data Layer
- Drizzle ORM with PostgreSQL
- Zod for schema validation
- Neon PostgreSQL (hosted database)

### Integrations
- **Twilio WhatsApp** — Conversational booking via WhatsApp messages
- **Replit Object Storage** — Worker ID documents and photo uploads
- **Google OAuth** — Employer sign-in via Google

### Internationalization
- English, isiZulu, Sesotho, Afrikaans
- Custom React context-based i18n system
- Language preference saved to localStorage

## Getting Started

```bash
npm install
npm run dev
```

Requires a `DATABASE_URL` environment variable pointing to a PostgreSQL database.

### Optional WhatsApp Integration
Set the following environment variables to enable WhatsApp booking:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`
