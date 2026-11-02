import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import i18n from '../src/lib/i18n';

// Simulate Expo Go: the native speech module is missing, and evaluating the package throws exactly like on the phone.
let packageLoaded = false;
jest.mock('expo', () => ({ ...jest.requireActual('expo'), requireOptionalNativeModule: () => null }));
jest.mock('expo-speech-recognition', () => {
  packageLoaded = true;
  throw new Error("Cannot find native module 'ExpoSpeechRecognition'");
});
// The Map tab's other native pieces, stubbed for Jest
jest.mock('react-native-maps', () => {
  const { forwardRef } = require('react');
  const { View } = require('react-native');
  const MapView = forwardRef((props: object, _ref: unknown) => <View testID="map" {...props} />);
  return { __esModule: true, default: MapView, Marker: (p: object) => <View {...p} /> };
});
jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: async () => ({ granted: false }), Accuracy: {} }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

afterAll(async () => (await require('../src/lib/localProvider').localProvider()).stop());

describe('voice search in Expo Go (native module missing)', () => {
  beforeEach(() => i18n.changeLanguage('en'));

  it('getSpeech() returns null without ever evaluating the package', () => {
    const { getSpeech, isVoiceAvailable } = require('../src/lib/voice');
    expect(getSpeech()).toBeNull();
    expect(isVoiceAvailable()).toBe(false);
    expect(packageLoaded).toBe(false);
  });

  it('the Map tab and its search bar render, and the mic explains it needs a development build', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const MapScreen = require('../src/app/(tabs)/index').default;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await render(<QueryClientProvider client={qc}><MapScreen /></QueryClientProvider>);

    expect(await screen.findByLabelText('Search malls, e.g. Paragon or พารากอน')).toBeTruthy();
    expect(screen.getByTestId('map')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Search by voice' }));
    expect(alert).toHaveBeenCalledWith('Voice search needs a development build (it does not work in Expo Go).');
    expect(packageLoaded).toBe(false);
    qc.clear();
  }, 300_000); // loading the whole Map tab under Jest is slow on this drive (about 2–3 minutes)
});
