export default {
  preset: "ts-jest/presets/default-esm",
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  globals: {
    "ts-jest": {
      tsconfig: "test/tsconfig.json",
      useESM: true,
    },
  },
  testRegex: "/test/.*\\.test\\.ts$",
  collectCoverageFrom: ["src/**/{!(*.d-ti),}.{ts,js}"],
  clearMocks: true,
  collectCoverage: true,
};
