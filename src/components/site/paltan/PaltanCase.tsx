import type { TeamTree } from "@/lib/team";
import { caseSubjects } from "./caseBits";
import CaseBoard from "./CaseBoard";
import CaseList from "./CaseList";

/* The paltan on /team: "kaun hain ye log?" Both versions render; CSS shows
   the scroll-driven board on lg screens with motion allowed and the stacked
   file everywhere else, so there is no layout jump on hydration. */
export default function PaltanCase({ tree }: { tree: TeamTree }) {
  const subjects = caseSubjects(tree);
  return (
    <section aria-label="The paltan" className="relative bg-ink">
      <CaseBoard subjects={subjects} />
      <CaseList subjects={subjects} />
    </section>
  );
}
