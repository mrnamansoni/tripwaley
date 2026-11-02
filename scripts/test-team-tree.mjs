#!/usr/bin/env node
/**
 * The paltan orbit chart on /team — who sits in the centre, who orbits whom.
 *
 * Run: node scripts/test-team-tree.mjs
 *
 * The admin enters people as a flat list with an optional "reports to". The
 * page needs a tree two rings deep: one person in the centre, the people who
 * report to them on the inner orbit, and everyone further down grouped under
 * their inner-orbit ancestor. Hidden rows, missing managers and loops must all
 * still produce a sensible chart — a typo in the admin should never blank the
 * page or drop a person silently.
 */

import assert from "node:assert/strict";
import { aboutFor, buildTeamTree, roleLine, teamError } from "../src/lib/team.ts";

let n = 0;
const ok = (label) => { n++; console.log(`  ✓ ${label}`); };

const m = (id, extra = {}) => ({
  id,
  name: id.toUpperCase(),
  role: `role of ${id}`,
  photo: "",
  punchline: "",
  published: true,
  ...extra,
});
const shape = (tree) =>
  tree && { lead: tree.lead.id, branches: tree.branches.map((b) => [b.member.id, b.crew.map((c) => c.id)]) };

console.log("\nteam tree — shape");
assert.equal(buildTeamTree([]), null);
ok("no people → no chart");

assert.deepEqual(shape(buildTeamTree([m("f")])), { lead: "f", branches: [] });
ok("one person sits alone in the centre");

assert.deepEqual(
  shape(buildTeamTree([
    m("f"),
    m("co", { reportsTo: "f" }),
    m("sales", { reportsTo: "f" }),
    m("hr", { reportsTo: "f" }),
    m("s1", { reportsTo: "sales" }),
    m("s2", { reportsTo: "sales" }),
    m("s1a", { reportsTo: "s1" }),
  ])),
  { lead: "f", branches: [["co", []], ["sales", ["s1", "s2", "s1a"]], ["hr", []]] },
);
ok("heads orbit the founder; everyone deeper groups under their head, in admin order");

assert.deepEqual(
  shape(buildTeamTree([m("sales", { reportsTo: "f" }), m("f"), m("co", { reportsTo: "f" })])),
  { lead: "f", branches: [["sales", []], ["co", []]] },
);
ok("the centre is whoever reports to nobody, wherever they sit in the list");

console.log("\nteam tree — messy data");
assert.deepEqual(
  shape(buildTeamTree([m("f"), m("co", { reportsTo: "f" }), m("x", { reportsTo: "ghost" })])),
  { lead: "f", branches: [["co", []], ["x", []]] },
);
ok("a manager that doesn't exist → the person joins the inner orbit");

assert.deepEqual(
  shape(buildTeamTree([m("f", { published: false }), m("co", { reportsTo: "f" }), m("s", { reportsTo: "co" })])),
  { lead: "co", branches: [["s", []]] },
);
ok("a hidden founder hands the centre to the next person up");

assert.deepEqual(
  shape(buildTeamTree([m("f"), m("a", { reportsTo: "b" }), m("b", { reportsTo: "a" })])),
  { lead: "f", branches: [["a", []], ["b", []]] },
);
ok("a reporting loop can't hide anyone");

assert.deepEqual(
  shape(buildTeamTree([m("f"), m("blank", { name: "  " }), m("co", { reportsTo: "f" })])),
  { lead: "f", branches: [["co", []]] },
);
ok("a row with no name never renders");

assert.deepEqual(
  shape(buildTeamTree([m("f"), m("f2"), m("co", { reportsTo: "f2" })])),
  { lead: "f", branches: [["f2", ["co"]]] },
);
ok("two people with no manager → the first is the centre, the second orbits");

console.log("\nteam validation");
const good = [m("f"), m("co", { reportsTo: "f" })];
assert.equal(teamError(good), null);
assert.equal(teamError([]), null);
ok("a clean list passes, and so does an empty one");

assert.match(teamError([m("f"), m("f")]), /duplicate/);
ok("duplicate ids are refused");

assert.match(teamError([m("f", { name: "" })]), /name/);
assert.equal(teamError([m("f", { name: "", published: false })]), null);
ok("a live person needs a name; a hidden draft chair doesn't");

assert.match(teamError([m("f", { role: " " })]), /role/);
ok("a live person needs a role");

assert.match(teamError([m("f", { reportsTo: "f" })]), /themselves/);
ok("nobody reports to themselves");

assert.match(teamError([m("f"), m("co", { reportsTo: "nope" })]), /reports to/);
ok("reports-to must name someone on the list");

assert.match(teamError([m("f"), m("a", { reportsTo: "b" }), m("b", { reportsTo: "a" })]), /loop/);
ok("reporting loops are refused");

assert.match(teamError([m("f", { punchline: "x".repeat(181) })]), /punchline/);
ok("punchlines stay punchy (180 characters max)");

assert.match(teamError([m("f", { published: "yes" })]), /published/);
ok("published must be a boolean");

assert.match(teamError([m("f", { about: "x".repeat(201) })]), /about/);
assert.match(teamError([m("f", { about: 3 })]), /about/);
ok("the who-they-are line is text, 200 characters max");

console.log("\nrole lines — the 'the person who…' line each role gets by default");
const line = (role) => roleLine(role) ?? "";
assert.match(line("Founder"), /foundation/);
assert.match(line("Founder & CEO"), /foundation/);
for (const r of ["Co-founder", "Cofounder", "co founder"]) assert.match(line(r), /believed in the founder/, r);
ok("founder and every spelling of co-founder get their own line");
assert.match(line("Tech Head"), /connected/);
assert.match(line("CTO"), /connected/);
assert.match(line("HR Head"), /home/);
assert.match(line("Sales Head"), /seat/);
assert.match(line("Team Lead"), /same direction/);
assert.match(line("Operations Head"), /on time/);
ok("tech, HR, sales, team lead and ops each get theirs");
assert.match(line("Head of Sales"), /seat/);
assert.doesNotMatch(line("Share-holder relations"), /home/);
ok("matching reads words, not letters inside other words");
assert.equal(roleLine("Chief Vibes Officer"), undefined);
ok("an unknown role gets no invented line");

assert.equal(aboutFor(m("f", { role: "Founder", about: "  Started it on a Tuesday.  " })), "Started it on a Tuesday.");
assert.match(aboutFor(m("f", { role: "Founder", about: "" })), /foundation/);
assert.equal(aboutFor(m("f", { role: "Chief Vibes Officer" })), "");
ok("the admin's own line wins; blank falls back to the role line");

console.log(`\n${n} checks passed\n`);
