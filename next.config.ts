import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita o Next detectar um workspace pnpm de outro projeto em diretórios acima
  // deste repo (aviso "ignored pnpm-lock.yaml ... outside the current Git repository").
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Build standalone (server.js + node_modules mínimos) usado pela imagem
  // Docker de produção (T7.4, infra/) — não afeta `next dev`.
  output: "standalone",
};

export default nextConfig;
