import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_ENABLE_KANBAN_DND:
      process.env.NEXT_PUBLIC_ENABLE_KANBAN_DND ??
      (process.env.NODE_ENV === "development" ? "true" : "false"),
  },
}

export default nextConfig
