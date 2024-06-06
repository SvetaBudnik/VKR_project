import { defineConfig } from 'vite'

import vue from '@vitejs/plugin-vue'

const matchers = [
    '**/tmps/**',
    '**/courses/**',
    '**\\tmps\\**',
    '**\\courses\\**',
    (str) => str.includes("tmps"),
    (str) => str.includes("courses"),
]

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    server: {
        watch: {
            ignored: matchers,
        }
    }
})
