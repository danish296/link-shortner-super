export type PlanId = "FREE" | "BASIC" | "PRO" | "GROWTH";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  linksPerMonth: number;
  qrcodes: number;
  campaigns: number;
  pages: number;
  domains: number;
  analyticsDays: number;
  popular?: boolean;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: "FREE",
    name: "Free",
    price: 0,
    tagline: "For testing the waters",
    linksPerMonth: 100,
    qrcodes: 5,
    campaigns: 3,
    pages: 1,
    domains: 0,
    analyticsDays: 7,
    features: [
      "100 links per month",
      "1,000 tracked clicks / mo",
      "5 QR codes",
      "Basic analytics (7 days)",
      "3 campaigns",
      "1 bio page",
    ],
  },
  BASIC: {
    id: "BASIC",
    name: "Basic",
    price: 5,
    tagline: "For creators getting started",
    linksPerMonth: 1000,
    qrcodes: 50,
    campaigns: 20,
    pages: 5,
    domains: 1,
    analyticsDays: 30,
    features: [
      "1,000 links per month",
      "50,000 tracked clicks / mo",
      "50 QR codes",
      "Advanced analytics (30 days)",
      "20 campaigns",
      "5 bio pages · 1 custom domain",
      "API access",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    price: 13,
    tagline: "For growing brands",
    linksPerMonth: 5000,
    qrcodes: 100,
    campaigns: 50,
    pages: 15,
    domains: 3,
    analyticsDays: 90,
    popular: true,
    features: [
      "5,000 links per month",
      "Unlimited tracked clicks",
      "100 QR codes (custom design)",
      "Advanced analytics (90 days)",
      "50 campaigns",
      "15 bio pages · 3 custom domains",
      "A/B testing & retargeting pixels",
      "Priority support",
    ],
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    price: 41,
    tagline: "For teams that scale fast",
    linksPerMonth: 15000,
    qrcodes: 250,
    campaigns: 150,
    pages: 30,
    domains: 10,
    analyticsDays: 365,
    features: [
      "15,000 links per month",
      "Unlimited tracked clicks",
      "250 QR codes",
      "Advanced analytics (365 days)",
      "150 campaigns",
      "30 bio pages · 10 custom domains",
      "A/B testing & retargeting pixels",
      "Dedicated support",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["FREE", "BASIC", "PRO", "GROWTH"];

export function getPlan(id: string | null | undefined): Plan {
  if (id && id in PLANS) return PLANS[id as PlanId];
  return PLANS.FREE;
}

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && value in PLANS;
}
