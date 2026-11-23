import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../lib/theme';
import { ministryById } from '../lib/brand';
import DashboardScreen from '../screens/DashboardScreen';
import MediaScreen from '../screens/MediaScreen';
import PrayerScreen from '../screens/PrayerScreen';
import GivingScreen from '../screens/GivingScreen';
import NoticeBoardScreen from '../screens/NoticeBoardScreen';
import DevotionalsScreen from '../screens/DevotionalsScreen';
import EventsScreen from '../screens/EventsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import GrowthScreen from '../screens/GrowthScreen';
import MinistriesScreen from '../screens/MinistriesScreen';
import MinistryDetailScreen from '../screens/MinistryDetailScreen';
import { TabBar } from '../components/TabBar';
import ChatHubScreen from '../screens/ChatHubScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import RoomInfoScreen from '../screens/RoomInfoScreen';
import JournalScreen from '../screens/JournalScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { roomById } from '../lib/chat';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

type MinistriesStackParamList = {
  MinistriesList: undefined;
  MinistryDetail: { id: string };
};
const MinistriesNav = createStackNavigator<MinistriesStackParamList>();

const { palette, fonts } = theme;

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={focused ? palette.navy : palette.muted} />,
        }}
      />
      <Tab.Screen
        name="Media"
        component={MediaScreen}
        options={{
          tabBarLabel: 'Media',
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? 'play-circle' : 'play-circle-outline'} size={22} color={focused ? palette.navy : palette.muted} />,
        }}
      />
      <Tab.Screen
        name="Pray"
        component={PrayerScreen}
        options={{
          tabBarLabel: 'Pray',
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={focused ? palette.navy : palette.muted} />,
        }}
      />
      <Tab.Screen
        name="Give"
        component={GivingScreen}
        options={{
          tabBarLabel: 'Give',
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? 'card' : 'card-outline'} size={22} color={focused ? palette.navy : palette.muted} />,
        }}
      />
      <Tab.Screen
        name="Ministries"
        component={MinistriesStack}
        options={{
          tabBarLabel: 'Ministries',
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={focused ? palette.navy : palette.muted} />,
        }}
      />
    </Tab.Navigator>
  );
}

function MinistriesStack() {
  return (
    <MinistriesNav.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: palette.canvas },
        headerTintColor: palette.ink,
        headerTitleStyle: { fontFamily: fonts.serif, fontSize: 21, color: palette.ink },
        cardStyle: { backgroundColor: palette.canvas },
      }}
    >
      <MinistriesNav.Screen
        name="MinistriesList"
        component={MinistriesScreen}
        options={{ headerShown: false }}
      />
      <MinistriesNav.Screen
        name="MinistryDetail"
        component={MinistryDetailScreen}
        options={({ route }) => ({
          title: ministryById(route.params?.id)?.name ?? 'Ministry',
        })}
      />
    </MinistriesNav.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: palette.canvas },
        headerTintColor: palette.ink,
        headerTitleStyle: { fontFamily: fonts.serif, fontSize: 21, color: palette.ink },
        cardStyle: { backgroundColor: palette.canvas },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NoticeBoard" component={NoticeBoardScreen} options={{ title: 'Notice board' }} />
      <Stack.Screen name="Devotionals" component={DevotionalsScreen} options={{ title: 'Devotionals' }} />
      <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Events' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
      <Stack.Screen name="Growth" component={GrowthScreen} options={{ title: 'Growth' }} />
      <Stack.Screen name="ChatHub" component={ChatHubScreen} options={{ title: 'Chats', headerTitle: '' }} />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={({ route }: any) => ({ title: roomById(route.params?.roomId)?.name ?? 'Chat' })}
      />
      <Stack.Screen name="RoomInfo" component={RoomInfoScreen} options={{ title: 'Room info' }} />
      <Stack.Screen name="Journal" component={JournalScreen} options={{ title: 'Your journal', headerTitle: '' }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications', headerTitle: '' }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function LoginScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.canvas }}>
      <Text style={{ fontSize: 18, color: palette.ink, marginBottom: 16 }}>Login deferred</Text>
      <Text style={{ fontSize: 14, color: palette.muted }}>Backend JWT fix needed</Text>
    </View>
  );
}