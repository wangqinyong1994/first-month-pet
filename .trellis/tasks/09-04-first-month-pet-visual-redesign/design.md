# Technical design

## Boundaries

The design layer owns visual tokens, layout, responsive behavior, project-local bitmap assets, and client-isolated form feedback. Server Components remain responsible for data and existing Server Actions remain the single mutation boundary.

## Visual system

- Use `next/font/google` Geist with a fallback system stack.
- Define semantic CSS custom properties for canvas, surface, ink, muted text, border, primary action, and semantic care states. Swap the token values through `prefers-color-scheme`.
- Keep content surfaces at 16px radius, inputs and buttons at 12px, and compact status labels at full radius.
- Treat coral as the one brand accent. Reserve amber and red for existing veterinarian-contact and urgent-care semantics.
- Use short opacity and transform transitions for hierarchy and interaction feedback. A reduced-motion media query removes transitions and animations.

## Component and interaction shape

- Keep page components server-rendered. Create small client leaves only for pending action controls and visual-only dismissal or state feedback.
- Reuse `useFormStatus` for forms that redirect after success. Reuse the existing `useActionState` profile form for save feedback.
- Preserve native `<details>` on Plan. Style its summary and content states without replacing its accessible disclosure behavior.
- Add route loading and error boundaries whose skeletons use the same page geometry as the final layout.

## Assets

- Generate a transparent square brand mark, a landscape login illustration with useful negative space, and a cohesive square illustration for each existing milestone.
- Save final assets under `public/brand/` and `public/milestones/` using new versioned names until consuming code is updated. Existing asset files are not overwritten.

## Compatibility and rollback

- No database, API, form, action, or route contract changes.
- A rollback is a presentation-only revert of the visual component, stylesheet, and newly referenced asset changes.
