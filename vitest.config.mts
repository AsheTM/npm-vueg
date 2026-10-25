import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        // CLI tests spawn a real Node process: on a busy machine they can exceed the 5 s default
        testTimeout: 20000,
    },
});
