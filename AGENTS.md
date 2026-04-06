# Project: AI Business English Training Platform

## Objective
Build a functional MVP in 2 weeks for a paid client.

This is a fast execution project. The goal is to deliver a working product, not a perfect system.

---

## Tech Stack
- Frontend: Next.js (App Router)
- Styling: Tailwind CSS
- Backend: Supabase (Auth + Database)
- AI: OpenAI API

---

## Core Features (MVP Scope)

### Priority Order
1. Lesson Generator (core value)
2. Lesson Viewer + Save Flow
3. Dashboard + Lesson Library
4. Course Generator
5. Workplace Communication Simulation

---

## Product Behavior

### Lesson Generator must produce:
- Title
- Summary
- Learning Objectives
- Vocabulary List
- Reading Text
- Comprehension Questions
- Speaking / Discussion Questions
- Grammar Exercises
- Role Play Scenario
- Quiz

All outputs must be structured and consistent.

---

## Development Principles

### Speed > Perfection
- Build fast, iterate later
- Avoid over-engineering
- Focus on working features first

### Simplicity
- Keep UI clean and minimal
- Avoid unnecessary abstractions
- Use straightforward patterns

### Reusability
- Build reusable components when possible
- Avoid duplicating logic

---

## AI Implementation Rules

- Always return structured JSON for:
  - lesson generation
  - course generation
  - simulation outputs when possible

- Validate AI responses before rendering
- Keep prompts consistent across the app
- Avoid long, unstructured text outputs

---

## Scope Control

Do NOT build:
- Advanced LMS integrations
- Multi-tenant enterprise systems
- Complex analytics dashboards
- Certification systems
- Advanced speech scoring

Keep everything MVP-level.

---

## Simulation (MVP)

- Text-based interaction is required
- Voice is optional and only if time allows
- Provide:
  - AI response
  - Feedback on user input
  - Suggestions for improvement

---

## Database Guidelines

- Keep schema simple and scalable
- Use Supabase for:
  - auth
  - storage
  - relational data

Core entities:
- users
- lessons
- courses
- modules
- simulations
- attempts

---

## Code Guidelines

- Use clean and readable code
- Keep files organized by feature
- Avoid large monolithic files
- Use clear naming conventions

---

## UI Guidelines

- Minimal and modern UI
- Prioritize usability over design complexity
- Ensure mobile responsiveness
- Avoid heavy animations

---

## Working Style

- Work in defined sprints
- Only implement what is requested for the current sprint
- Do not jump ahead to future features unless explicitly asked
- Ask for clarification before making major decisions

---

## Definition of Done

A feature is complete when:
- It works end-to-end
- It is usable by a real user
- It is saved correctly in the database (if applicable)
- It does not break existing functionality

---

## Project Context

This is a paid client project.

Decisions should favor:
- reliability
- clarity
- speed of delivery

Avoid unnecessary experimentation.
