import type { PetType } from "./types";

const imageRoot = "/images/first-month-pet";

export const visualImage = {
  hero: `${imageRoot}/hero-home.jpg`,
  dayOne: `${imageRoot}/day-one-space.jpg`,
  login: `${imageRoot}/login-home.jpg`,
  onboarding: `${imageRoot}/onboarding-home.jpg`,
  routine: `${imageRoot}/plan-routine.jpg`,
  paywall: `${imageRoot}/paywall-timeline.jpg`,
  safety: `${imageRoot}/safety-observation.jpg`,
  support: `${imageRoot}/support-home.jpg`,
  checkout: `${imageRoot}/checkout-wait.jpg`
} as const;

export function petVisualImage(petType: PetType): string {
  return petType === "cat"
    ? `${imageRoot}/home-cat.jpg`
    : `${imageRoot}/home-dog.jpg`;
}
