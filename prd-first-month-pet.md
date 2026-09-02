# First Month Pet MVP PRD

Date: 2026-09-02

## Product Overview

First Month Pet is an English MVP for new pet adopters in Europe and North America. It helps a first-time adopter understand what to expect during the first 30 days, what to do next, and when a concern may require veterinary help.

Core value:

- Reduce anxiety during the first month after adoption.
- Help users avoid missing key care steps.

This product is not a medical diagnosis tool and must not position itself as a replacement for a veterinarian.

## Target User

The MVP targets a new adopter who has just brought home one cat or dog and is unsure what is normal during the settling-in period.

MVP supports only one new pet profile.

Out of scope for MVP:

- Multi-pet management.
- Shelter or rescue organization workflows.
- Veterinary chat.
- Medical attachment upload.
- Vaccine card OCR.
- Email, SMS, or browser push reminders.
- Full long-term health management.
- Multi-language support.

## Core User Problem

After bringing home a newly adopted pet, the user worries about:

- Whether behaviors such as hiding, low appetite, diarrhea, vomiting, or low energy are part of settling in.
- What to do on Day 1, during the first week, and across the first month.
- Whether they have missed important steps such as a vet check, vaccine record review, deworming, or basic observation.
- When a concern should lead to contacting a vet or seeking urgent care.

## Account And Data

Authentication:

- Email magic link.

Cloud data saved:

- Low-sensitivity pet profile data.
- Care progress.
- Selected concerns.
- Task completion status.
- Milestone unlock status.

Not saved in MVP:

- Medical attachments.
- Photos.
- Vet documents.
- Doctor notes.

## Pet Profile Creation

Required fields:

- Pet type: cat / dog.
- Name.
- Adoption date.
- Estimated age: kitten or puppy / adult / senior / unknown.
- Health records status: yes / no / not sure.
- Adoption source: shelter / breeder / friend / stray / other.
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

The concern selection is lightweight. It is not a forced triage questionnaire.

## Home Priority

After profile creation, the home screen prioritizes:

1. Selected concerns, sorted by risk level.
2. Current Day X onboarding content.
3. Today's most important action.
4. Most recent unlocked milestone.

If the user selected multiple concerns, the system sorts them by risk level rather than by selection order. The home screen does not explain the sorting by default. The explanation appears inside the concern detail page.

## 30-Day Onboarding Plan

Timeline structure:

- Day 1 to Day 7: daily nodes.
- Week 2, Week 3, Week 4: weekly nodes.

Each node contains three modules:

- Common settling-in signs.
- What to do today.
- When to seek help.

The content should be based on broadly applicable public veterinary and animal welfare guidance for English-speaking Europe and North America.

The home screen should stay light. Source links and disclaimer appear in detail pages.

## Concern Detail Pages

Each concern has three levels of guidance:

- Common settling-in.
- Ask a vet.
- Seek urgent care.

Do not use green / yellow / red labels. Use clear text labels to avoid implying diagnosis.

Most rules are shared across cats and dogs. Only a small number of high-risk differences should branch by pet type, such as cats being more sensitive to extended appetite loss.

Required safety language:

- Use phrases such as "may", "consider contacting a vet", "seek urgent care if", and "not medical advice".
- Avoid phrases such as "normal", "safe", "diagnosis", or "your pet is fine".

## Tasks And Reminders

Task sources:

- 30-day onboarding nodes.
- Pet profile condition branches.
- Selected concerns.

Task statuses:

- Not done.
- Done.
- Upcoming.
- Overdue.

When a user completes a task, record:

- task_id.
- done_at.

Do not record notes, photos, or attachments in MVP.

Reminders are in-app only. No email, SMS, or browser push reminders in MVP.

## Milestones

Use the name "Milestones", not "Achievements".

Purpose:

- Give users positive feedback.
- Reinforce that they are taking useful steps.
- Avoid turning pet health into a game.

Placement:

- Home shows the most recent or newly unlocked milestone.
- Profile contains the full Milestones list.
- Milestones are not part of the main navigation.

MVP milestones:

- First Day Together.
- Safe Space Set Up.
- First Meal Check.
- Vet Visit Planned.
- Records Checked.
- Settling-In Week Complete.
- Concern Handled Thoughtfully.
- Routine Taking Shape.
- First Month Complete.

Trigger model:

- Time-based milestones unlock automatically.
- Action-based milestones unlock after task completion.
- Concern-based milestones unlock after the user views guidance and chooses a next step.

Unlock record:

- milestone_id.
- unlocked_at.
- trigger_task_id.
- trigger_concern_id.

Locked milestones show soft hints instead of hard conditions. Example:

- "Keep following your first-week plan."
- "Plan your first vet check when you're ready."
- "Continue through your 30-day care plan."

Milestones do not unlock paid features or discounts in MVP. First Month Complete may later connect to long-term health reminders.

## Monetization

Free preview includes:

- Day 1 content.
- Basic guidance for today's selected concerns.
- Day 1 milestone.
- Future node titles and dates visible, with body content locked.

Paid unlock includes:

- Full 30-day onboarding timeline.
- Personalized care steps based on pet type, age stage, source, health record status, and selected concerns.
- In-app upcoming / overdue reminders.
- Full concern detail pages with sources.
- Full Milestones progression.

Pricing:

- $9.99 one-time purchase.
- Purchase is bound to one pet profile.
- A second pet requires a new $9.99 purchase.
- 7-day refund policy.

Payment:

- Creem Checkout.
- No custom payment page in MVP.
- After successful payment, the user returns to Home and sees the current Day X plus the unlocked full timeline.

Paywall copy:

- "Unlock your full 30-day care plan and feel more prepared through the first month."

CTA:

- "Unlock my 30-day plan - $9.99"

Paywall display:

- Future nodes show title and date.
- Locked body content requires purchase.

## Suggested Navigation

Recommended MVP navigation:

- Home: concern priority, Day X content, today's action, recent milestone.
- Plan: full 30-day timeline.
- Profile: pet profile, Milestones, account state.

Avoid a heavy SaaS sidebar structure for MVP.

## Success Metrics

Track:

- Profile creation completion rate.
- Day 1 view completion rate.
- Concern detail open rate.
- Paywall click rate.
- Creem purchase conversion rate.
- Day 3 return rate.
- Day 7 return rate.
- Task completion rate.
- Refund rate.

## MVP Success Standard

Within one minute after profile creation, the user should understand:

- What to pay attention to today.
- What to do next.
- What situation may require veterinary help.
