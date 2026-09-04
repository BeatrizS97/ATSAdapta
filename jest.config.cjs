module.exports = {
  // Os testes de lógica pura (geradores de arquivo, formatadores) rodam em
  // ambiente Node. Os testes de componentes React usam o comentário
  // "/** @jest-environment jsdom */" no topo do arquivo para trocar de
  // ambiente individualmente, já que precisam de DOM (document, window).
  testEnvironment: "node",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  moduleFileExtensions: ["js", "jsx"],
  testMatch: ["**/tests/**/*.test.[jt]s?(x)"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
