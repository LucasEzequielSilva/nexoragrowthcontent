

# Waves Content Engine — Implementation Plan

## Overview
A personal brand content operations platform for an AI agency founder, featuring competitor tracking, content pipeline management, calendar scheduling, and weekly briefs. Dark theme with indigo (#6366f1) accent, Supabase backend, Framer Motion animations.

## Phase 1: Foundation
- **Auth & Layout**: Supabase email/password auth, login page with branding, protected routes
- **Dark theme**: Configure CSS variables for dark mode with indigo accent
- **Sidebar navigation**: Collapsible sidebar with Lucide icons for all 8 pages (Dashboard, Calendar, Ideas, Competitors, Competitor Content, Pillars, Briefs, Settings)
- **Database**: Create all 7 tables (competitors, competitor_content, content_ideas, content_pillars, content_idea_pillars, weekly_briefs) with RLS policies for single-user auth

## Phase 2: Core Data Pages
- **Content Pillars** (/pillars): CRUD grid with color-coded cards, icon display, idea counts. Pre-seed 6 pillars (Build in Public, AI Tool Tutorials, Agency Playbook, Founder Stories, Product Breakdowns, LATAM Tech)
- **Competitors** (/competitors): Card grid with avatars, platform follower counts. Click → profile with Content Feed, Analytics (Recharts line charts), and Insights tabs. Pre-seed 5 competitors (Jacob Klug, Christian Peverelli, Harry Roper, Agustín Medina, Mikey)
- **Competitor Content Log** (/competitors/content): Unified feed with filters (competitor, platform, date, analyzed status), detail slide-over with analysis notes, "Analyze" placeholder button

## Phase 3: Content Pipeline
- **Content Ideas** (/ideas): Table view with filter bar (status, platform, pillar, priority, source), click → detail slide-over with editable fields, rich text draft editor, status workflow buttons, bulk actions. Pre-seed 3-4 sample ideas across statuses
- **Content Calendar** (/calendar): Monthly/weekly toggle, day cells with pillar-color-coded cards, platform icons, status badges. Click card → slide-over edit panel. Drag-and-drop rescheduling. Filter by platform/pillar/status

## Phase 4: Dashboard & Briefs
- **Dashboard** (/): Stats row (pipeline count, weekly content, competitors tracked, agent ideas), kanban-style pipeline visualization, this week's plan cards, competitor pulse feed, recent agent suggestions, quick action buttons
- **Weekly Briefs** (/briefs): List view ordered by date, detail view with competitor highlights, trending topic tags, promotable suggested ideas (one-click to content_ideas), "Generate New Brief" placeholder

## Phase 5: Settings & Polish
- **Settings** (/settings): Profile section, API keys placeholders, agent config placeholders, data export
- **Polish**: Loading skeletons on all data fetches, empty states with CTAs, toast notifications on all CRUD ops, Framer Motion animations on modals/slide-overs, debounced search on all lists, consistent status badge colors

## Key UX Details
- Status colors: idea=gray, researching=blue, drafting=yellow, review=orange, scheduled=purple, published=green
- All slide-over panels animate in/out with Framer Motion
- Mobile-first responsive design throughout
- Recharts for all analytics/charts

