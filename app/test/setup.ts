jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// expo-crypto is native; in tests use Node's SHA-256 so demo password hashing behaves like on a phone.
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: async (_alg: string, text: string) => require('crypto').createHash('sha256').update(text).digest('hex'),
}));

// shortcut: Reanimated 4's own mock still boots the native runtime under Jest, so stub the few APIs the components use.
// Animations are visual only; tests check content and behaviour.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    View,
    useReducedMotion: () => true,
    useSharedValue: (value: unknown) => require('react').useRef({ value }).current, // stable, like the real hook
    useAnimatedStyle: () => ({}),
    withRepeat: (v: unknown) => v,
    withTiming: (v: unknown) => v,
    cancelAnimation: () => {},
  };
});
