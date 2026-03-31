import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import api from '../../src/lib/api';
import { fontFamily } from '../../src/theme';

function TabBadge({ count }: { count: number }) {
  const { colors } = useTheme();
  if (count <= 0) return null;
  return (
    <View style={{
      position: 'absolute', top: -4, right: -8,
      backgroundColor: colors.error.DEFAULT,
      borderRadius: 10, minWidth: 18, height: 18,
      justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
    }}>
      <Text style={{ color: colors.white, fontSize: 10, fontFamily: fontFamily.bold }}>
        {count > 99 ? '99+' : String(count)}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const { data: unread = { messages: 0, notifications: 0 } } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/api/unread-count');
      return data;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const unreadMessages = unread.messages ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 20, right: 20,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderRadius: 28,
          height: 68,
          paddingBottom: 10, paddingTop: 10, paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent.DEFAULT,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: fontFamily.semiBold,
          marginTop: 2,
        },
        tabBarItemStyle: { borderRadius: 20 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.accent.lighter }]}>
              <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'İlan',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.accent.lighter }]}>
              <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Teklifler',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.accent.lighter }]}>
              <Ionicons name={focused ? 'pricetag' : 'pricetag-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.accent.lighter }]}>
              <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={22} color={color} />
              <TabBadge count={unreadMessages} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.accent.lighter }]}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
});
