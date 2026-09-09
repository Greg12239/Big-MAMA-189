"use client";

import { createRoot, type Root } from "react-dom/client";
import { useEffect } from "react";
import { KineticBrandmark } from "./hero/KineticBrandmark";

export function HeroMotion() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero");
    const visual = hero?.querySelector<HTMLElement>(".hero__visual");
    if (!hero || !visual) return;

    let root: Root | undefined;

    visual.replaceChildren();
    root = createRoot(visual);
    root.render(<KineticBrandmark heroElement={hero} />);

    return () => root?.unmount();
  }, []);

  return null;
}
