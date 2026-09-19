import type { ComponentProps } from "react";
import CurtainFooter from "./CurtainFooter";
import ExploreLinks from "./ExploreLinks";

/* The footer every public page uses: the site index, then the curtain.
   A server component, so the index reads the live catalog on the server and
   ships as plain HTML links. */
export default function SiteFooter(props: ComponentProps<typeof CurtainFooter>) {
  return (
    <>
      <ExploreLinks />
      <CurtainFooter {...props} />
    </>
  );
}
