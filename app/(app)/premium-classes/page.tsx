import PremiumCourseSearch from "../../../components/premium/PremiumCourseSearch";
import { listPremiumCourses } from "../../../lib/premiumClasses";

export const dynamic = "force-static";

export default async function PremiumClassesPage() {
  const courses = await listPremiumCourses();

  return (
    <section className="mobile-page-shell">
      <div className="lumen-page">
        <div className="mb-6 sm:mb-8">
          <p className="lumen-chip">
            Premium Classes
          </p>
          <h1 className="lumen-page-title mt-4">
            Premium Classes
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--ink-muted)]">
            Browse the full premium course library and open each module inside the app.
          </p>
        </div>

        <PremiumCourseSearch courses={courses} />
      </div>
    </section>
  );
}
