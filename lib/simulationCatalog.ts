export type SimulationCatalogItem = {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  role: string;
  industry: string;
};

export const simulationCatalog: SimulationCatalogItem[] = [
  {
    id: "project_kickoff",
    title: "Project Kickoff Meeting",
    description:
      "Align stakeholders on scope, timelines, and ownership for a new client project.",
    level: "B1",
    duration: "10 min",
    role: "Project Manager",
    industry: "Technology & IT",
  },
  {
    id: "sales_meeting",
    title: "Client Sales Meeting",
    description:
      "Present your solution, handle objections, and move the client toward a decision.",
    level: "B2",
    duration: "12 min",
    role: "Sales Manager",
    industry: "Sales & Retail",
  },
  {
    id: "job_interview",
    title: "Job Interview",
    description:
      "Introduce your experience clearly and explain why you fit the role.",
    level: "B1",
    duration: "10 min",
    role: "Product Manager",
    industry: "Technology & IT",
  },
  {
    id: "negotiation",
    title: "Commercial Negotiation",
    description:
      "Discuss pricing, timing, and terms while protecting the value of your offer.",
    level: "C1",
    duration: "15 min",
    role: "Business Development Manager",
    industry: "Finance & Banking",
  },
  {
    id: "presentation",
    title: "Executive Presentation",
    description:
      "Deliver a recommendation to senior stakeholders and answer follow-up questions.",
    level: "B2",
    duration: "12 min",
    role: "Business Analyst",
    industry: "Marketing & Advertising",
  },
  {
    id: "customer_service_call",
    title: "Customer Service Escalation",
    description:
      "Resolve a frustrated customer's issue and rebuild confidence in your team.",
    level: "B1",
    duration: "8 min",
    role: "Customer Success Manager",
    industry: "Telecommunications",
  },
  {
    id: "board_meeting",
    title: "Board Meeting Update",
    description:
      "Summarize performance, explain risks, and secure alignment on next steps.",
    level: "C1",
    duration: "15 min",
    role: "COO",
    industry: "Manufacturing",
  },
  {
    id: "performance_review",
    title: "Performance Review",
    description:
      "Discuss achievements, improvement areas, and concrete development goals.",
    level: "B2",
    duration: "10 min",
    role: "Department Manager",
    industry: "Human Resources",
  },
  {
    id: "conflict_resolution",
    title: "Conflict Resolution",
    description:
      "Navigate tension between teams and guide the discussion toward a workable plan.",
    level: "B2",
    duration: "10 min",
    role: "Team Leader",
    industry: "Construction & Engineering",
  },
];
