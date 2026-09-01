import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita o Next detectar um workspace pnpm de outro projeto em diretórios acima
  // deste repo (aviso "ignored pnpm-lock.yaml ... outside the current Git repository").
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
