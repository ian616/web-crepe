import { main } from "./app.js";

declare global {
  interface Window { __CREPE_INITED__?: boolean }
}

if (!window.__CREPE_INITED__) {
  window.__CREPE_INITED__ = true;
  main().catch(console.error);
}
