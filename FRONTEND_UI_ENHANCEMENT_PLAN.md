# Frontend UI Enhancement Plan

## Objective
Enhance the frontend UI to ensure consistency, accessibility (contrast), and seamless integration between Ant Design 6.1 and Tailwind CSS 4.1. The goal is a polished, professional look with robust light/dark mode support.

## Core Technologies
- **Framework**: React 19
- **UI Library**: Ant Design 6.1
- **Styling**: Tailwind CSS 4.1
- **Icons**: Ant Design Icons

## Strategy

### 1. Foundation & Theme Synchronization
- **Audit Theme Configuration**: Ensure `antdTheme.js` and `tailwind.config.js` share the exact same color palette.
- **CSS Variables**: Verify that Tailwind's CSS variable usage aligns with Antd's token system where possible.
- **Global Styles**: Check `index.css` for global resets or overrides that might conflict.

### 2. Component Pattern Standardization
- **Avoid Hardcoded Colors**: Replace specific color classes (e.g., `bg-white`, `text-gray-900`) with semantic classes (e.g., `bg-surface`, `text-primary`) or Antd tokens.
- **Spacing**: Use Tailwind's spacing scale consistently.
- **Typography**: Ensure consistent font sizes and weights across headers and body text.

### 3. Feature-by-Feature Enhancement
I will iterate through the `features` directory:
- **Auth**: Login, Register pages.
- **Dashboard/Layout**: Sidebar, Header, User Profile.
- **Faculty**: Lists, Forms, Details.
- **Student**: Lists, Forms, Details.
- **Industry**: Portals, Listings.
- **Shared**: Common components used across features.

### 4. Accessibility & Polish
- **Contrast Check**: Verify text contrast ratios in both light and dark modes.
- **Interactive States**: Ensure hover, focus, and active states are visible and consistent.
- **Transitions**: Add subtle transitions for theme switching and interactive elements.

## Execution Steps
1.  **Initialize**: Create this plan and the tracker.
2.  **Theme Sync**: Refine `antdTheme.js` and `tailwind.config.js`.
3.  **Global Components**: Polish `Layout`, `PageHeader`, `Notification`.
4.  **Feature Iteration**: Fix UI in `auth`, `faculty`, `student`, etc.
5.  **Final Review**: Walkthrough and contrast audit.

---
