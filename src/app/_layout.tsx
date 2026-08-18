import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import FullArticle from '@/components/FullArticle';
import { useT } from '@/i18n';
import { AppProvider, useApp } from '@/store/app';

function RootTabs() {
  const { palette, isDark } = useApp();
  const t = useT();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.accent,
          tabBarInactiveTintColor: palette.tabInactive,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: palette.tabBar,
            borderTopColor: palette.border,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.1 },
          sceneStyle: { backgroundColor: palette.bg },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('feed'),
            tabBarIcon: ({ color, size }) => <Ionicons name="reader-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: t('discover'),
            tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="daily"
          options={{
            title: t('daily'),
            tabBarIcon: ({ color, size }) => <Ionicons name="today-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: t('insights'),
            tabBarIcon: ({ color, size }) => <Ionicons name="bulb-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile'),
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          }}
        />
        {/* Reachable by navigation, hidden from the tab bar */}
        <Tabs.Screen name="bookmarks" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
      <FullArticle />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <RootTabs />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
