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
          tabBarShowLabel: false,
          tabBarActiveTintColor: palette.accent,
          tabBarInactiveTintColor: palette.tabInactive,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: palette.tabBar,
            borderTopColor: palette.border,
            height: 58,
            paddingTop: 8,
          },
          sceneStyle: { backgroundColor: palette.bg },
        }}>
        {/* Inshorts-style 3-icon bar: Search · Home · Profile */}
        <Tabs.Screen
          name="discover"
          options={{
            title: t('discover'),
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'search' : 'search-outline'} size={26} color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: t('feed'),
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile'),
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={26} color={color} />,
          }}
        />
        {/* Reachable from the top tabs / navigation, hidden from the bottom bar */}
        <Tabs.Screen name="daily" options={{ href: null }} />
        <Tabs.Screen name="insights" options={{ href: null }} />
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
