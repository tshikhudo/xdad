# MaidSync - Domestic Worker Platform

## Overview

MaidSync is a mobile-first Progressive Web App (PWA) designed to connect informal domestic workers (primarily cleaners) with employers in South Africa. The platform focuses on trust, safety, and dignity for both workers and employers, aiming to replace informal street-corner hiring with a reliable, verified system.

The application supports multiple South African languages (English, isiZulu, Sesotho, Afrikaans) and is optimized for low-end Android devices with minimal data usage.

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