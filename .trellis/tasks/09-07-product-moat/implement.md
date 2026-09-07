# DTC public first visit implementation

1. Add `getPublicLandingData()` in `lib/app-data.ts`.
   - Query the free node and only the safe fields needed for locked nodes and Day 1 tasks.
   - Explicitly project locked nodes and Day 1 tasks so paid content cannot be serialized.
2. Replace anonymous root redirect in `app/page.tsx` with semantic public landing sections: result, real Day 1 body, two free tasks, safety guidance, metadata-only locked timeline, pricing/boundary, and login CTAs.
   - Keep the existing authenticated redirect branch exactly equivalent.
3. Compact `app/login/page.tsx` around account creation/saving without changing `signInAction`, success/error notices, or its authenticated redirect.
4. Add only scoped CSS for the landing/login layout and mobile behavior.
5. Add a focused runnable domain test for the metadata-only timeline projection; run unit tests, lint, TypeScript, production build, diff checks, anonymous browser checks, and a raw HTML/RSC content scan.
6. Add locally generated original image assets through `next/image` across public, account, plan, safety, payment, and support routes. Keep all action and safety copy before supporting images on mobile, and choose cat/dog scenes only from the signed-in profile type.

## Review gates

- Inspect the rendered anonymous route at desktop and 390px widths for keyboard focus order, CTA order, and horizontal overflow.
- Confirm protected phrases from paid Day 2+ content are absent from anonymous HTML and Flight responses.
- Do not commit unrelated dirty-worktree changes.
