# First Month Pet Page Structure And User Flow Spec

Date: 2026-09-02

## Scope

This spec defines the MVP page structure and user flows for First Month Pet.

It covers:

- Home.
- Plan.
- Profile.
- Paywall.
- Checkout Return.

It does not cover visual design, implementation code, database migrations, or payment integration code.

## Navigation Model

Use three primary app areas after login:

- Home: today's highest-signal view.
- Plan: full 30-day onboarding timeline.
- Profile: pet profile, account state, and Milestones list.

Avoid a sidebar SaaS structure for MVP. The product supports one pet, so the navigation should stay small.

## Entry Flow

### Logged-Out User

Primary flow:

1. User lands on the app.
2. User enters email.
3. User receives magic link.
4. User returns authenticated.
5. If no pet profile exists, user enters pet profile creation.
6. If a pet profile exists, user enters Home.

### Pet Profile Creation

Required fields:

- Pet type: cat / dog.
- Name.
- Adoption date.
- Estimated age: kitten or puppy / adult / senior / unknown.
- Health records status: yes / no / not sure.
- Adoption source: shelter / breeder / friend / stray / other.
- New arrivals at the same time: one / two / three or more.
- Whether another pet already lives at home.
- Current concerns: multi-select.

Current concern options:

- Not eating or drinking.
- Diarrhea or unusual stool.
- Vomiting.
- Hiding or fearful.
- Coughing, sneezing, or nasal discharge.
- Low energy or weakness.
- Scratching, fleas, or skin issue.
- Litter box / potty accidents.
- No concern right now.

On submit:

- Create the pet profile.
- Generate or resolve the current Day X from adoption date.
- Unlock the free preview state.
- Send the user to Home.

## Home

Purpose:

- Answer "What should I pay attention to today?"
- Reassure without overpromising.
- Surface the next useful action.

Home content order:

1. Concern priority area.
2. Current Day X onboarding card.
3. Today's most important action.
4. Recent Milestone feedback.
5. Daily Better / About the same / Worse check-in.
6. Compact link to Plan.

When the user selects Worse, keep the check-in and link to the highest-priority concern, or Profile if none is selected.

### Concern Priority Area

If selected concerns exist:

- Show selected concerns sorted by risk level.
- The highest-risk concern appears first.
- Each concern card shows a short guidance preview.
- Do not show green / yellow / red labels.
- Use text categories only:
  - Common settling-in.
  - Ask a vet.
  - Seek urgent care.

If multiple concerns exist:

- Sort by risk level.
- Do not explain sorting on Home.
- Show the reason inside the concern detail page.

If no concern exists:

- Show a calm empty state.
- Provide a "Something feels off?" action to update concerns.

Free user behavior:

- Show basic guidance for today's selected concerns.
- Show Common settling-in, Ask a vet, and Seek urgent care on every concern detail page.
- Lock only paid context: priority rationale and source notes.

Paid user behavior:

- Show full concern guidance and detail access.

### Current Day X Onboarding Card

The card shows the current timeline node based on adoption date.

Each node contains:

- Common settling-in signs.
- What to do today.
- When to seek help.

Free user behavior:

- Day 1 body content is visible.
- Future body content is locked.

Paid user behavior:

- Current node body content is visible.
- Full timeline is accessible from Plan.

### Today's Most Important Action

Show one primary task selected from:

- Today's timeline node.
- User profile conditions.
- Selected concerns.

Task states:

- Not done.
- Done.
- Upcoming.
- Overdue.

When user marks task done:

- Save done_at.
- Recalculate upcoming / overdue state.
- Check whether a Milestone should unlock.

### Recent Milestone Feedback

Show the most recently unlocked Milestone if one exists.

The copy should explain why the action matters. Example:

- "Safe Space Set Up. A quiet space helps many newly adopted pets feel safer while they settle in."

If no Milestone is newly unlocked, show a compact progress indicator instead of a large empty module.

## Plan

Purpose:

- Show the complete 30-day onboarding structure.
- Let the user preview future nodes.
- Make paid value visible without aggressive pressure.

Timeline structure:

- Day 1.
- Day 2.
- Day 3.
- Day 4.
- Day 5.
- Day 6.
- Day 7.
- Week 2.
- Week 3.
- Week 4.

Each node shows:

- Title.
- Date or date range.
- Status: current / upcoming / completed / locked.
- Tasks inside the node.
- Three content modules:
  - Common settling-in signs.
  - What to do today.
  - When to seek help.

Free user behavior:

- Day 1 content is visible.
- Future node titles and dates are visible.
- Future body content is locked.
- Locked nodes show the paywall CTA.

Paid user behavior:

- All 30-day nodes are visible.
- Upcoming / overdue task state is visible.
- Completed task state is visible.

## Profile

Purpose:

- Let the user review pet profile data.
- Show account and purchase state.
- Show Milestones without making them the product's main focus.

Profile sections:

- Pet profile.
- Current concerns.
- Health record status.
- Account.
- Purchase state.
- Milestones.

Editable pet fields:

- Name.
- Estimated age.
- Health records status.
- Adoption source.
- Current concerns.

Editing adoption date should be allowed within a reasonable MVP rule, but it must not create a new charge. If changed, recalculate Day X and task dates.
Editing conditions or concerns also reconciles generated tasks without deleting prior completion history.

### Milestones List

Show all MVP Milestones:

- First Day Together.
- Safe Space Set Up.
- First Meal Check.
- Vet Visit Planned.
- Records Checked.
- Settling-In Week Complete.
- Concern Handled Thoughtfully.
- Routine Taking Shape.
- First Month Complete.

Unlocked item display:

- Name.
- Unlocked date.
- Value explanation copy.

Locked item display:

- Name.
- Soft hint, not a hard condition.

Example locked hints:

- "Keep following your first-week plan."
- "Plan your first vet check when you're ready."
- "Continue through your 30-day care plan."

Free user behavior:

- Show unlocked Day 1 related Milestone.
- Show future Milestones as locked.

Paid user behavior:

- Show full progression.

## Paywall

Purpose:

- Explain what $9.99 unlocks.
- Avoid fear-based selling.
- Keep the offer tied to reduced anxiety and missed-care prevention.

Primary copy:

- "Unlock your full 30-day care plan and feel more prepared through the first month."

CTA:

- "Unlock my 30-day plan - $9.99"

Offer details:

- One-time $9.99 purchase.
- Unlocks one pet profile.
- Includes full 30-day onboarding timeline.
- Includes personalized care steps.
- Includes in-app upcoming / overdue reminders.
- Includes concern context and source notes.
- Includes full Milestones progression.
- 7-day refund.

Do not imply:

- Diagnosis.
- Vet replacement.
- Guaranteed health outcome.

Paywall appears from:

- Locked future Plan nodes.
- Locked concern detail pages.
- Reminder features for free users.

## Checkout Return

Purpose:

- Bring the user back to the app after Creem Checkout.
- Confirm unlock state without making the user start over.

Expected flow:

1. User clicks paywall CTA.
2. App creates a Creem Checkout Session.
3. User pays on Creem-hosted Checkout.
4. Creem redirects to Checkout Return route.
5. App verifies purchase state from backend/database.
6. If unlocked, redirect or return to Home.
7. Home shows current Day X and full unlocked timeline access.

Return states:

- Processing: payment result is not yet reflected locally.
- Unlocked: purchase is fulfilled and pet profile is unlocked.
- Failed or canceled: user returns without unlock and can retry.

Do not rely only on the browser redirect for fulfillment. The unlock must be driven by Creem webhook fulfillment, with the return route reading the resulting local purchase state.

## Core Flow Summary

Happy path:

1. Email magic link login.
2. Create pet profile.
3. See Home with concern priority, Day 1 content, today's action, and first Milestone.
4. Preview locked future Plan nodes.
5. Open Paywall.
6. Pay via Creem Checkout.
7. Return to Home.
8. Continue full 30-day plan.

Free path:

1. Email magic link login.
2. Create pet profile.
3. Use Day 1 content and basic concern guidance.
4. See locked future nodes and locked future Milestones.

30-day completion path:

1. User reaches Day 31.
2. App shows a compact handoff for routine care and veterinary follow-up over the next three months.
3. Active concerns and outstanding tasks remain visible.
4. MVP does not implement a long-term plan or reminders.

## Acceptance Criteria

- A new user can log in, create one pet profile, and land on Home.
- Home prioritizes selected concerns before the Day X content.
- Multiple concerns are sorted by risk level.
- Day 1 is visible to free users.
- Future Plan node titles and dates are visible to free users, while body content is locked.
- Paid users can view all 30-day timeline content.
- The paywall uses the approved copy and CTA.
- Checkout Return does not grant access unless the local purchase state is fulfilled.
- Profile shows Milestones with unlocked state and soft locked hints.
- No page implies medical diagnosis or vet replacement.
