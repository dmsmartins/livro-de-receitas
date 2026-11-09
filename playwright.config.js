import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',fullyParallel:true,
  use:{baseURL:'http://127.0.0.1:4173/livro-de-receitas/',channel:process.env.PW_CHANNEL||undefined},
  webServer:{command:'node tests/server.js',url:'http://127.0.0.1:4173/livro-de-receitas/index.html',reuseExistingServer:!process.env.CI},
  projects:[{name:'desktop',use:{viewport:{width:1365,height:900}}},{name:'mobile',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}]
});
