import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, type ColorValue } from 'react-native';
import { useTheme } from '../../lib/theme';

const icon = (glyph: string) => ({ color }: { color: ColorValue }) => <Text style={{ color, fontSize: 20 }}>{glyph}</Text>;

export default function TabsLayout() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTintColor: t.text,
        tabBarStyle: { backgroundColor: t.bg, borderTopColor: t.border },
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: tr('tabs.map'), tabBarIcon: icon('🗺️') }} />
      <Tabs.Screen name="search" options={{ title: tr('tabs.search'), tabBarIcon: icon('🔍') }} />
      <Tabs.Screen name="settings" options={{ title: tr('tabs.settings'), tabBarIcon: icon('⚙️') }} />
    </Tabs>
  );
}
