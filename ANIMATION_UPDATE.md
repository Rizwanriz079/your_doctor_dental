# Dental website animation and feature update

This update keeps the existing Next.js application, teal/navy branding, Supabase integration, authentication, admin tools and booking workflow. No new packages or database migrations are required.

## What changed

- Welcome intro: a 2.4-second animated tooth/logo screen on the homepage, once per browser-tab session. Skip intro and Escape dismiss it. Reduced-motion preferences, paused motion and anchor links bypass it. A native dialog contains focus; scrolling is restored when it closes.
- Hero: animated ambient light, breathing orbit outlines, moving tooth scan contours, sparkle and beacon effects; a shortcut to the treatment finder.
- Pages and cards: page entrance, enhanced scroll reveals, staggered content, interactive card borders and animated service/doctor filter results.
- Homepage treatment finder: searches active services and filters by the actual catalogue categories. Booking links preselect the chosen service in the existing booking flow. Hidden prices stay hidden. It does not diagnose conditions or recommend treatments.
- First-visit guide: three steps explaining booking and confirmation, plus an interactive preparation checklist with progress. Checklist selections are temporary and are not submitted or stored.
- FAQ: expandable keyboard-accessible answers about booking, dentists, appointment status and changes.
- Navigation helpers: scroll progress, back-to-top control and a mobile call/book bar on the public information pages. The booking bar is hidden during booking and account flows.
- Booking: a running summary of selected service, dentist, date and time, plus an accessible mobile progress indicator.
- Motion: a persistent pause/resume preference, operating-system reduced-motion support, and static SVG artwork when effects are disabled. SVG gradient and clip IDs are unique when multiple tooth illustrations appear.

## Run locally

1. Extract the ZIP and open `your_doctor_dental-main` in VS Code.
2. Use your existing `.env.local` with the same Supabase project settings. If setting up a fresh local copy, copy `.env.example` to `.env.local` and fill in the values using your project settings. Do not share secret keys.
3. Run `npm ci`.
4. Run `npm run dev` and visit `http://localhost:3100`.

The source ZIP does not contain database credentials or a database export. Keep using the clinic's existing Supabase instance; do not run the demo seed against production to apply this UI update.

## Update the existing Vercel website

Copy the updated project source into the repository already connected to your Vercel project. Keep the existing Vercel environment variables and deployment settings. Review the changes and deploy through your usual Git/Vercel workflow. The existing package and lockfile versions are unchanged.

This ZIP has not been deployed to the live Vercel domain.

## Validation

- `npm run typecheck`: passed.
- `npm run build`: passed, including Next.js compilation and route generation.
- Browser interaction and responsive visual checks: not verified. The preview connection failed even after a temporary launcher adapter; the test fixture and adapter were removed. The original dev command has been preserved. Mobile CSS accounts for safe areas, small portrait widths and short landscape viewports, but visual device testing is still required.
- Live authentication, availability and appointment submissions: not verified because the ZIP does not include the clinic's Supabase connection settings.
- Backend and database logic were not modified.

## Before client handover

On your configured local or Vercel preview environment:

1. Check the homepage at phone, tablet and desktop sizes. Confirm the mobile bar does not cover the footer or form controls.
2. Search treatments, select each category, test an unmatched search and use Clear filters. Open a booking link and confirm the chosen service carries through after any required login.
3. Test the service and doctor directory filters, including their empty states.
4. Open/close FAQs with keyboard and mouse. Toggle checklist items and verify the progress count.
5. Pause motion, reload and confirm the preference remains; resume it. Also test the OS reduced-motion setting.
6. Complete a test appointment against a test database and check the existing confirmation/status flow.
7. Check the clinic's real contact details, service catalogue and clinician information in the existing admin settings.

## Main files

New: `components/public/care-finder.tsx`, `visit-guide.tsx`, `experience-tools.tsx`, `components/animations/motion-preferences.tsx`, and `app/(public)/template.tsx`.

Updated: public layout/homepage, global styles, hero, tooth illustration, cards, browsers, shared reveals, reduced-motion hook, booking wizard and step indicator.
