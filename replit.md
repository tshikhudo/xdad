# Febreeze Clean - Domestic Worker Platform

## Overview

Febreeze Clean is a mobile-first Progressive Web App (PWA) designed to connect informal domestic workers (primarily cleaners) with employers in South Africa. The platform focuses on trust, safety, and dignity for both workers and employers, aiming to replace informal street-corner hiring with a reliable, verified system.

The application supports multiple South African languages (English, isiZulu, Sesotho, Afrikaans) and is optimized for low-end Android devices with minimal data usage.

## Scope-Based Pricing Model

Febreeze Clean uses a **scope-based pricing model** where employers describe their needs and receive a fixed price - they NEVER choose workers, hours, or negotiate.

### Booking Flow
1. **House Size** - Small (1x), Medium (1.5x), Large (2x)
2. **Tasks** - General Cleaning (1x), Ironing (0.5x), Laundry (0.6x), Windows (0.4x), Deep Clean (1.2x)
3. **Availability Window** - Morning, Afternoon, Flexible
4. **Date** - Today, Tomorrow, This Week, Next Week
5. **Area** - Major South African cities
6. **Payment Method** - Cash (pay worker directly), EFT (bank transfer), Card (speedpoint machine)
7. **Review & Confirm** - Fixed price shown, calculated server-side

### Authentication
- **Username/Password based** - Simple login with username and password
- **Google login** - Employers can also sign in with Google (via Replit Auth)
- **Admin credentials**: pfunzo1/Password.1 and Ray1/Password.1
- **User roles**: worker (home + profile), employer (home + book + login), admin (home + admin panel)

### Pricing Formula
```
Price = basePrice × houseSizeMultiplier × sum(taskWeights)
Worker Payout = Price × workerPayoutPercent
```

### Security
- Price is **always calculated server-side** using admin-configured pricing rules
- Client-provided prices are rejected/ignored
- Enum validation for house sizes, tasks, and availability windows

### Trust System
- **Worker Ratings**: Visible to employers and admin
- **Employer Reliability Score**: Hidden from employers, shown to workers as trust indicator
- **Verification Badges**: ID verified, background checked, trained workers

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a mobile-first design philosophy with:
- Bottom navigation pattern for easy thumb access
- Large touch targets and minimal UI clutter
- Safe area handling for notched devices
- PWA-ready with meta tags and theme colors

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful JSON API under `/api/*` routes
- **Development**: Vite middleware for HMR in development
- **Production**: Static file serving from built assets

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Validation**: Zod schemas generated from Drizzle schema via `drizzle-zod`
- **Current Storage**: In-memory storage (`server/storage.ts`) with interface for database migration

The storage layer uses an interface pattern (`IStorage`) that allows swapping between in-memory storage (current) and PostgreSQL (future) without changing the API routes.

### Internationalization (i18n)
- Custom React context-based i18n system
- Translation strings stored in `client/src/lib/i18n.ts`
- Language preference persisted to localStorage
- All UI text uses translation keys, no hardcoded strings

### Key Design Patterns
- **Shared Types**: TypeScript types shared between client and server via `@shared/*` path alias
- **API Requests**: Centralized fetch wrapper in `client/src/lib/queryClient.ts`
- **Component Structure**: UI primitives in `components/ui/`, feature components at top level

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations stored in `/migrations`
- **connect-pg-simple**: Session storage for Express (available but not currently in use)

### UI Framework
- **Radix UI**: Full suite of accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **Lucide React**: Icon library

### Data Fetching
- **TanStack React Query**: Server state management and caching

### Build & Development
- **Vite**: Frontend bundler with React plugin
- **esbuild**: Server-side bundling for production
- **tsx**: TypeScript execution for development

### Form Handling
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Zod integration for form validation

### WhatsApp Integration (Twilio)
- **Twilio SDK**: For sending/receiving WhatsApp messages
- **Webhook endpoint**: `/api/whatsapp/webhook` receives incoming messages
- **Conversational booking**: Users text the WhatsApp number to book, guided through house size → tasks → time → date → area → confirm flow
- **Environment variables needed**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- **Test endpoint**: `/api/whatsapp/test` for simulating conversations without Twilio
- **Status endpoint**: `/api/whatsapp/status` to check if Twilio is configured

### Object Storage
- **Replit Object Storage**: For document uploads (worker ID documents, photos)
- **Upload hook**: `client/src/hooks/use-upload.ts` handles presigned URL upload flow
- **Routes**: `/api/storage/upload-url` for requesting upload URLs, `/objects/*` for serving files