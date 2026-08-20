export type TechGroup = { category: string; items: string[] };

export const TECH_STACK: TechGroup[] = [
  {
    category: "Languages",
    items: ["JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "Rust", "Ruby", "PHP", "Kotlin", "Swift"],
  },
  {
    category: "Frontend",
    items: ["React", "Next.js", "Vue", "Angular", "Svelte", "HTML/CSS"],
  },
  {
    category: "Backend & Data",
    items: ["Node.js", "Django", "Spring", ".NET", "PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL", "REST APIs"],
  },
  {
    category: "Cloud & DevOps",
    items: ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD"],
  },
];
