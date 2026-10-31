import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',timeout:60000,workers:1,use:{baseURL:process.env.CHESSMATE_TEST_URL||process.env.LTW_TEST_URL||'http://127.0.0.1:4173',channel:'msedge',headless:true,viewport:{width:1440,height:1050},trace:'retain-on-failure'},reporter:'list'});
