# replit.md

## Overview

MoodAware is a full-stack mood tracking and wellness application built with React, Express.js, and PostgreSQL. The application allows users to track their daily moods, write journal entries, set goals, and receive personalized recommendations based on their emotional state and weather conditions. The app features a dynamic theme system that adapts to the time of day and integrates with weather services to provide contextual insights.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state and caching
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for dynamic theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM
- **API Design**: RESTful APIs with JSON responses
- **Middleware**: Custom logging and error handling
- **Development**: Hot module replacement with Vite integration

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type sharing between client and server
- **Migration Strategy**: Drizzle migrations with push-based development workflow

## Key Components

### Database Schema
- **mood_entries**: Stores user mood data with timestamps, weather context, and notes
- **journal_entries**: Contains journal content with associated mood and weather data
- **daily_goals**: Tracks user-defined goals with progress indicators
- **user_preferences**: Stores user settings including location and theme preferences

### API Endpoints
- **Weather API**: `/api/weather` - Fetches current weather data with city parameter
- **Mood Tracking**: `/api/mood-entries` - CRUD operations for mood entries with date range filtering
- **Journal System**: `/api/journal-entries` - Journal entry management
- **Goal Management**: `/api/daily-goals` - Daily goal tracking and progress updates
- **User Preferences**: `/api/user-preferences` - User settings management

### Frontend Components
- **Dynamic Theming**: Time-based theme switching (morning, afternoon, evening, night)
- **Interactive Mood Selector**: Circular mood selection interface
- **Weather Integration**: Real-time weather display with mood correlation
- **Dashboard Cards**: Contextual advice and music recommendations
- **Data Visualization**: Weekly mood recap with visual charts
- **Responsive Design**: Mobile-first approach with glass-effect styling

## Data Flow

1. **User Interaction**: User selects mood through interactive circular interface
2. **Data Capture**: Mood entry created with current time, weather data, and context
3. **Storage**: Data persisted to PostgreSQL via Drizzle ORM
4. **Real-time Updates**: TanStack Query invalidates and refetches data
5. **Contextual Response**: App provides personalized recommendations based on mood and weather
6. **Visualization**: Historical data displayed in weekly recap charts

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL for cloud database hosting
- **Weather Service**: OpenWeatherMap API for weather data (with fallback mock data)
- **UI Library**: Radix UI for accessible component primitives
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: TanStack Query for server state management

### Development Dependencies
- **Build Tools**: Vite for development server and build optimization
- **Type Safety**: TypeScript for static type checking
- **Code Quality**: ESLint configuration for code standards
- **Validation**: Zod for runtime type validation and schema inference

## Deployment Strategy

### Build Process
1. **Client Build**: Vite compiles React app to static assets in `dist/public`
2. **Server Build**: esbuild bundles Express server to `dist/index.js`
3. **Database Setup**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **OPENWEATHER_API_KEY**: Weather service API key (optional, has fallback)
- **NODE_ENV**: Environment designation (development/production)

### Production Deployment
- **Server**: Node.js Express server serving both API and static files
- **Database**: PostgreSQL with connection pooling
- **Assets**: Static files served from `dist/public` directory

## Changelog

Changelog:
- July 04, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.