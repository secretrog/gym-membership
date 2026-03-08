# Design System: Gym Management System

## 1. Visual Theme & Atmosphere
A modern, energetic, and premium aesthetic. The public showcase feels vibrant and welcoming, with bold typography and high-contrast fitness imagery. The private admin dashboard uses a clean, data-dense "glassmorphism" style to manage revenue and attendance, prioritizing readable tables and distinct status indicators. The overall vibe is "Motivating, Structured, and High-End."

## 2. Color Palette & Roles
*   **Deep Charcoal Background** (`#121212`): Used for the main application background on public and admin pages to create a sleek, dramatic stage for content.
*   **Neon Citrus Accent** (`#D4FF00`): Used for primary calls-to-action (e.g., "Join Now", "Check-in"), active streaks, and highlighting key revenue metrics. It provides a massive injection of energy.
*   **Fitness Slate Surface** (`#1E1E1E`): Used for cards, tables, and modal backgrounds to create depth against the main background.
*   **Crisp White Text** (`#FFFFFF`): Used for primary headings and prominent data points.
*   **Muted Ash Text** (`#A0A0A0`): Used for secondary text, table headers, and less critical information.
*   **Danger Crimson** (`#FF3B30`): Used for "Overdue" or "Inactive" status badges and destructive actions.
*   **Success Emerald** (`#34C759`): Used for "Paid" or "Active" status badges.
*   **Warning Amber** (`#FF9F0A`): Used for "Pending" or "Expiring Soon" status badges.

## 3. Typography Rules
*   **Headings**: Bold, impactful sans-serif (e.g., *Inter* or *Oswald*). Headers should be tightly tracked (negative letter-spacing) for a modern, athletic feel.
*   **Body Text**: Clean, highly legible sans-serif (e.g., *Inter* or *Roboto*). Regular weight for general readability, Medium weight for table data.

## 4. Component Stylings
*   **Buttons**:
    *   *Primary*: Neon Citrus background, solid Deep Charcoal text. Sharp, squared-off edges (`rounded-none` or `rounded-sm`) for a tough, industrial gym feel. Hover state slightly brightens.
    *   *Secondary*: Transparent background, Neon Citrus or Crisp White border.
*   **Cards/Containers**:
    *   Fitness Slate Surface background.
    *   Subtle borders (`border border-white/10`).
    *   Subtly rounded corners (`rounded-lg`).
    *   Whisper-soft diffused shadows (`shadow-lg`).
*   **Status Badges**:
    *   Pill-shaped (`rounded-full`).
    *   Soft translucent background of the status color (e.g., `bg-emerald-500/20`).
    *   Solid text color of the status color (e.g., `text-emerald-400`).
*   **Inputs/Forms**:
    *   Fitness Slate Surface background.
    *   Subtle border (`border-white/20`).
    *   Sharp corners to match buttons.
    *   Focus state outlines the input in Neon Citrus.

## 5. Layout Principles
*   **Public Showcase**: Large, immersive hero sections. Generous whitespace to let photography breathe. Alternating content blocks.
*   **Admin Dashboard**: Sidebar navigation. Dense, grid-based layouts for metrics cards. Full-width tables with sticky headers for scrolling through members.
