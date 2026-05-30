import Button from "../../../components/shared/Button";
import Card from "../../../components/shared/Card";

const plans = [
  {
    name: "Starter",
    price: "Free",
    cadence: "for individuals",
    description: "For individuals getting started with lessons and simulations.",
    features: [
      "Unlimited lesson generation",
      "Premium course access",
      "Simulation practice",
      "Private lesson library",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    cadence: "per month",
    description: "For instructors and teams building structured programs.",
    features: [
      "Everything in Starter",
      "Advanced lesson formats",
      "Premium course pathways",
      "Priority support",
    ],
    highlight: true,
  },
  {
    name: "Team",
    price: "$99",
    cadence: "per month",
    description: "For growing teams with shared content and oversight.",
    features: [
      "Team library",
      "Shared templates",
      "Workspace preferences",
      "Admin visibility controls",
    ],
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <section className="mobile-page-shell">
      <div className="lumen-page">
        <div className="mb-7">
          <p className="lumen-chip">
            Pricing
          </p>
          <h1 className="lumen-page-title mt-4">
            Pricing
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
            Simple plans for individuals and teams.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative p-7 ${
                plan.highlight
                  ? "border-[var(--border-strong)] shadow-glow"
                  : "border-[var(--border)]"
              }`}
            >
              {plan.highlight ? (
                <span className="lumen-chip absolute right-6 top-6">
                  Best value
                </span>
              ) : null}
              <h2 className="lumen-heading text-2xl text-[var(--ink)]">
                {plan.name}
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                {plan.description}
              </p>
              <div className="mt-6">
                <p className="lumen-heading text-4xl text-[var(--ink)]">
                  {plan.price}
                </p>
                <p className="lumen-label mt-1">
                  {plan.cadence}
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-[var(--ink-muted)]">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <Button
                className={`mt-6 w-full px-4 py-3 text-xs ${
                  plan.highlight
                    ? "border-transparent bg-[image:var(--aurora-line)] text-[var(--accent-ink)] shadow-glow hover:opacity-95"
                    : ""
                }`}
              >
                Choose {plan.name}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
