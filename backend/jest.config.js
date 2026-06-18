const rootDir = __dirname;

const baseConfig = {
  rootDir,
  testEnvironment: 'node',
};

module.exports = {
  projects: [
    {
      ...baseConfig,
      displayName: 'integration',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testMatch: ['<rootDir>/tests/**/*.test.js'],
    },
    {
      ...baseConfig,
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.js'],
    },
  ],
};
