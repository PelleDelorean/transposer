import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

export default createJestConfig({
  coverageProvider: "v8",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
});
