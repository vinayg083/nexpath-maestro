import type { IconName } from "@/lib/icons/LucideIcon";

export type RoadmapExploreItem = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  detail: string;
};

export const ROADMAP_EXPLORE_ITEMS: RoadmapExploreItem[] = [
  {
    id: "important-documents",
    title: "Important Documents",
    description:
      "Keep birth certificates, IDs, and release paperwork together so you can access them quickly when applying for jobs, housing, or benefits.",
    icon: "Folder",
    detail:
      "Important documents are the foundation for almost every step of reentry. Having copies of your ID, Social Security card, birth certificate, and release paperwork makes it easier to apply for housing, employment, benefits, and healthcare without delays.",
  },
  {
    id: "managing-emotions",
    title: "Managing Emotions",
    description:
      "Learn practical ways to handle stress, frustration, and uncertainty as you adjust to new routines, relationships, and responsibilities outside.",
    icon: "ThumbsUp",
    detail:
      "Reentry can bring strong emotions, especially when plans change or progress feels slow. Building simple coping strategies now helps you stay focused, communicate more clearly, and make steadier decisions during stressful moments.",
  },
  {
    id: "taking-care-of-health",
    title: "Taking care of my health",
    description:
      "Build everyday habits for sleep, nutrition, movement, and preventive care so you have the energy and stability to work toward your goals.",
    icon: "User",
    detail:
      "Physical and mental health support every other part of your roadmap. Regular checkups, medication management, and basic self-care routines make it easier to stay employed, manage stress, and keep moving forward.",
  },
  {
    id: "finding-housing",
    title: "Finding Housing",
    description:
      "Explore shelter, transitional, and long-term housing options while gathering the paperwork and references landlords commonly request.",
    icon: "House",
    detail:
      "Stable housing creates a base for employment, healthcare, and community connections. Understanding your options early—and what documents you may need—can reduce setbacks when you are ready to apply.",
  },
  {
    id: "getting-medical-attention",
    title: "Getting medical attention",
    description:
      "Find clinics, insurance options, and urgent-care resources so you can address health needs before they become bigger obstacles.",
    icon: "HeartPulse",
    detail:
      "Medical care is often easier to arrange before an emergency happens. Knowing where to go, what coverage you may qualify for, and how to keep follow-up appointments helps protect your health and your progress.",
  },
];

export function getRoadmapExploreItem(id: string) {
  return ROADMAP_EXPLORE_ITEMS.find((item) => item.id === id);
}
