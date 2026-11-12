import type { ChartConfig } from "@/components/ui/chart";

/**
 * Demo data for the App1 dashboard.
 *
 * Avatars are deliberately omitted rather than pointed at stock photo URLs:
 * a remote image that 404s renders as a broken box, and AvatarFallback
 * already shows initials. Pass an `avatar` here if you have real assets.
 */
export interface App1Person {
  name: string;
  initials: string;
  avatar?: string;
}

export const app1User: App1Person = {
  name: "Tanishq Jain",
  initials: "TJ",
};

const people: Record<string, App1Person> = {
  maya: { name: "Maya Rodriguez", initials: "MR" },
  sam: { name: "Sam Okafor", initials: "SO" },
  lena: { name: "Lena Fischer", initials: "LF" },
  arjun: { name: "Arjun Mehta", initials: "AM" },
};

export const app1ChartConfig = {
  opened: { label: "Opened", color: "var(--chart-1)" },
  completed: { label: "Completed", color: "var(--chart-2)" },
} satisfies ChartConfig;

export const app1Chart = [
  { week: "W1", opened: 34, completed: 28 },
  { week: "W2", opened: 41, completed: 33 },
  { week: "W3", opened: 29, completed: 36 },
  { week: "W4", opened: 47, completed: 38 },
  { week: "W5", opened: 38, completed: 42 },
  { week: "W6", opened: 52, completed: 45 },
  { week: "W7", opened: 44, completed: 49 },
  { week: "W8", opened: 39, completed: 51 },
];

export type App1Status = "In progress" | "In review" | "Planning";

export interface App1Project {
  id: string;
  name: string;
  description: string;
  status: App1Status;
  progress: number;
  dueDate: string;
  team: App1Person[];
}

export const app1Projects: App1Project[] = [
  {
    id: "p1",
    name: "Mobile app redesign",
    description: "New onboarding flow and a refreshed component library.",
    status: "In progress",
    progress: 72,
    dueDate: "28 Nov",
    team: [people.maya, people.sam],
  },
  {
    id: "p2",
    name: "Billing migration",
    description: "Move invoicing off the legacy service without downtime.",
    status: "In review",
    progress: 90,
    dueDate: "19 Nov",
    team: [people.lena, people.arjun, people.maya],
  },
  {
    id: "p3",
    name: "Search relevance",
    description: "Rank results by recency as well as keyword match.",
    status: "Planning",
    progress: 18,
    dueDate: "12 Dec",
    team: [people.arjun],
  },
];

export interface App1ActivityEntry {
  id: string;
  person: App1Person;
  action: string;
  time: string;
}

export const app1Activity: App1ActivityEntry[] = [
  { id: "a1", person: people.maya, action: "merged “Fix sidebar overflow”", time: "12 minutes ago" },
  { id: "a2", person: people.arjun, action: "opened 3 tasks in Search relevance", time: "1 hour ago" },
  { id: "a3", person: people.lena, action: "moved Billing migration to In review", time: "3 hours ago" },
  { id: "a4", person: people.sam, action: "commented on the onboarding spec", time: "Yesterday" },
];
