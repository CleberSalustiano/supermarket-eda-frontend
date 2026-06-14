module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules', '<rootDir>/../../node_modules'],
  moduleNameMapper: {
    '^expo-modules-core$': '<rootDir>/node_modules/expo-modules-core'
  }
};
