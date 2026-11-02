import { Tabs } from 'expo-router';
import { Map as MapIcon, SquareParking, User, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { FONT } from '../../components/ui';
import { elevation, useTheme, type Theme } from '../../lib/theme';

/** A6c tab bar: the active tab is a filled navy circle, the others thin outline icons. */
function TabIcon({ icon: Icon, focused, t }: { icon: LucideIcon; focused: boolean; t: Theme }) {
  return (
    <View style={[styles.circle, focused && { backgroundColor: t.primary }]}>
      <Icon size={22} color={focused ? t.onPrimary : t.textMuted} strokeWidth={focused ? 2 : 1.6} />
    </View>
  );
}

/** UI-1: the middle tab is a larger circle raised above the bar, because it is the main action while parked. */
function MiddleIcon({ focused, t }: { focused: boolean; t: Theme }) {
  return (
    <View style={[styles.middle, elevation(t), { backgroundColor: focused ? t.primary : t.accentTint, borderColor: t.background }]}>
      <SquareParking size={28} color={focused ? t.onPrimary : t.accentText} strokeWidth={2} />
    </View>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: t.background, borderTopColor: t.border, height: 84, paddingTop: 8 },
        tabBarActiveTintColor: t.text,
        tabBarInactiveTintColor: t.textMuted,
        tabBarLabelStyle: { fontFamily: FONT.medium, fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: tr('tabs.map'), tabBarIcon: ({ focused }) => <TabIcon icon={MapIcon} focused={focused} t={t} /> }} />
      <Tabs.Screen
        name="parking"
        options={{
          title: tr('tabs.parking'),
          headerShown: true,
          headerTitleStyle: { fontFamily: FONT.semibold },
          headerStyle: { backgroundColor: t.background },
          headerTintColor: t.text,
          headerShadowVisible: false,
          tabBarIcon: ({ focused }) => <MiddleIcon focused={focused} t={t} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: tr('tabs.account'),
          headerShown: true,
          headerTitleStyle: { fontFamily: FONT.semibold },
          headerStyle: { backgroundColor: t.background },
          headerTintColor: t.text,
          headerShadowVisible: false,
          tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} t={t} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  circle: { width: 44, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  middle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: -26, borderWidth: 4 },
});
