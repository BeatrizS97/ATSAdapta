import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { apiDevPlugin } from "./dev-server/apiDevPlugin.js";

export default defineConfig(({ mode }) => {
  // Carrega as variáveis do .env (o terceiro argumento vazio faz o Vite
  // carregar TODAS as variáveis, não só as prefixadas com "VITE_") e injeta
  // em process.env. Antes, isso era feito automaticamente pela CLI da
  // Vercel ao rodar "vercel dev"; agora que o projeto roda só com
  // "npm run dev" (Vite puro), fazemos esse carregamento manualmente, para
  // que lib/iaService.js continue lendo process.env.GEMINI_API_KEY
  // normalmente. Isso acontece só no processo Node do servidor de
  // desenvolvimento — nunca é exposto ao código do navegador.
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    plugins: [react(), apiDevPlugin()],
    server: {
      port: 5173,
    },
  };
});