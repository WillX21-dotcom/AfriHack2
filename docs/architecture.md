# Royal Square Financial Architecture

## Overview
Royal Square Financial is a unified wealth management, advisory services, and claims management platform designed for the South African financial services sector.

The platform provides a dual interface:
1. **Client PWA** (`apps/client`): A mobile-first Progressive Web App for clients to monitor net worth, track financial goals, initiate service requests, report motor vehicle accidents, view claim timelines, upload secure compliance documents, and communicate with advisers.
2. **Adviser Dashboard** (`apps/dashboard`): A desktop-oriented operational command center for financial advisers and compliance officers to manage clients, adjudicate workflows, update claims, triage tasks and reminders, inspect audit logs, and coordinate provider communications.

## Technology Stack
- **Frontend Architecture**: Pure Vanilla TypeScript, semantic HTML5, modern CSS3 (custom responsive design token system). No bloated single-page framework overhead (no React/Angular/Vue dependencies in client/dashboard core logic).
- **Visualization**: Chart.js for asset allocation and net worth history.
- **Backend & Persistence**: Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security, Secure Storage, Supabase Realtime).
- **PWA**: Service Worker with offline shell caching, Web App Manifest, push notification ready.
- **Mock Integrations**: Realistic provider simulation layer (`mocks/insurer`, `mocks/providers`, `mocks/email`) modeling Discovery, Old Mutual, Sanlam, Liberty, Santam, and Allan Gray.
