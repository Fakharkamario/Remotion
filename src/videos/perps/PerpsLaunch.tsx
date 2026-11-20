// GOAT Funded Perps launch video, scenes 1-2 (0:00-0:11), 1920x1080 @ 30 fps.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Brand, C, loadBrand } from "./brand";
import { Scene3D } from "./Scene3D";
import { Overlay } from "./Overlay";

export { PERPS_FRAMES } from "./timeline";

export const PerpsLaunch: React.FC = () => {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [handle] = useState(() => delayRender("perps brand assets"));
  useEffect(() => {
    loadBrand().then((b) => {
      setBrand(b);
      continueRender(handle);
    });
  }, [handle]);
  if (!brand) return null;
  return (
    <AbsoluteFill style={{ background: C.ground }}>
      <ThreeCanvas width={1920} height={1080} gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 34, near: 0.05, far: 60 }}>
        <Scene3D brand={brand} />
      </ThreeCanvas>
      <Overlay />
    </AbsoluteFill>
  );
};
