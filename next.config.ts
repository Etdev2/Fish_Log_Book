import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /*
   * The dev-only route indicator floats over the bottom-left corner of every page. On the
   * tide screen — which is a single-screen instrument with a bottom nav and no page scroll
   * — it sits on top of the nav and reads like part of the product. Off, so what is being
   * reviewed on a phone is the app and nothing else. Compile and runtime errors still
   * surface; this only hides the badge.
   */
  devIndicators: false,
};

export default nextConfig;
