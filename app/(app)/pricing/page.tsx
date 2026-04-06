import Button from "../../../components/shared/Button";
import Card from "../../../components/shared/Card";

const plans = [
  {
    name: "Starter",
    price: "Free",
    cadence: "for individuals",
    description: "For individuals getting started with lesson and course generation.",
    features: [
      "Unlimited lesson generation",
      "Basic course outlines",
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
      "Course templates",
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
    <section className="py-10">
      <div className="mx-auto max-w-[960px]">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
            Pricing
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[var(--ink)]">
            Pricing
          </h1>
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            Simple plans for individuals and teams.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative rounded-3xl p-7 ${
                plan.highlight
                  ? "border-[var(--accent-gold)] shadow-md"
                  : "border-[var(--border)]"
              }`}
            >
              {plan.highlight ? (
                <span className="absolute right-6 top-6 rounded-full border border-[var(--accent-gold)] bg-[var(--accent-gold-soft)] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[var(--accent-gold)]">
                  Best value
                </span>
              ) : null}
              <h2 className="font-serif text-2xl text-[var(--ink)]">
                {plan.name}
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                {plan.description}
              </p>
              <div className="mt-6">
                <p className="text-3xl font-semibold text-[var(--ink)]">
                  {plan.price}
                </p>
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                  {plan.cadence}
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-[var(--ink-muted)]">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <Button
                className={`mt-6 w-full rounded-lg px-4 py-2 text-xs font-semibold ${
                  plan.highlight
                    ? "border border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[#0c0b0a] hover:bg-[#d4ad55]"
                    : "border border-[var(--border-strong)] bg-[var(--surface-card)] text-[var(--ink)] hover:bg-[var(--surface-raised)]"
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
