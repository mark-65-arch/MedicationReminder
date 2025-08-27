# Senior Med Tracker

## Overview

Senior Med Tracker is a privacy-focused Progressive Web Application (PWA) designed specifically for seniors to manage their medications. The app emphasizes accessibility, simplicity, and complete offline functionality without any external data sharing. It features large touch targets, high contrast colors, and straightforward navigation to help seniors easily track their medications, set reminders, and view their medication history.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses vanilla HTML, CSS, and JavaScript with a single-page application (SPA) structure. The UI follows a screen-based architecture with distinct views for loading, main menu, medication management, and settings. The design prioritizes accessibility with:
- Large typography (minimum 18px body text, 24px headings)
- High contrast color scheme with primary blue (#1565C0) and secondary green (#2E7D32)
- Touch targets minimum 56dp for senior-friendly interaction
- Linear navigation flow avoiding complex menu structures

### Data Storage
The app uses browser localStorage for all data persistence, ensuring complete privacy compliance. No external databases or cloud services are used. Data is structured in JSON format and stored locally with three main collections:
- Medications array for active prescriptions
- History array for tracking medication intake
- Settings object for user preferences (sound, vibration, contrast, text size)

### PWA Implementation
The application is built as a Progressive Web App using:
- Service Worker (sw.js) for offline functionality and caching
- Web App Manifest (manifest.json) for native app-like installation
- Application cache strategy for core resources (HTML, CSS, JS, manifest)
- Offline-first approach ensuring functionality without internet connection

### Accessibility Features
The CSS architecture includes multiple accessibility modes:
- High contrast mode with enhanced color differences
- Text size variants (normal, large) for visual impairments
- Focus indicators for keyboard navigation
- ARIA labels and semantic HTML for screen readers
- Minimum 1.4x line height for improved readability

### State Management
The application uses a class-based architecture (MedicationApp) with centralized state management. The main application class handles:
- Data loading and persistence to localStorage
- Screen navigation and rendering
- Settings application and user preferences
- Notification permissions and scheduling

## External Dependencies

### Browser APIs
- **Service Worker API** - For PWA functionality and offline caching
- **Web App Manifest** - For installable app behavior
- **localStorage** - Primary data storage mechanism
- **Notification API** - For medication reminders (permission-based)
- **Vibration API** - For haptic feedback on medication alerts

### No External Services
The application deliberately avoids all external dependencies to maintain privacy requirements:
- No cloud storage or synchronization services
- No analytics or tracking services
- No external APIs for medication data
- No crash reporting or telemetry services
- No content delivery networks (CDNs) for libraries

### PWA Standards Compliance
- Follows Progressive Web App standards for offline functionality
- Implements proper caching strategies for core application resources
- Provides native app-like experience through web technologies
- Supports installation on mobile devices and desktops