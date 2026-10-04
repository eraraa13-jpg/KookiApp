import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import HomeScreen from '../screens/HomeScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import AccountsScreen from '../screens/AccountsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarLabelStyle: { fontWeight: '600', fontSize: 11, marginTop: 2 },
      tabBarIcon: ({ focused, color }) => {
        const icons = { Home: 'home', Reports: 'bar-chart', AddTransaction: 'add-circle', Accounts: 'wallet', Settings: 'settings' };
        if (route.name === 'AddTransaction') {
          return <View style={styles.addBtn}><Ionicons name="add-circle" size={36} color="#fff" /></View>;
        }
        return <Ionicons name={focused ? icons[route.name] : icons[route.name] + '-outline'} size={24} color={color} />;
      },
    })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'خانه' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ tabBarLabel: 'گزارش' }} />
      <Tab.Screen name="AddTransaction" component={AddTransactionScreen} options={{ tabBarLabel: '' }} />
      <Tab.Screen name="Accounts" component={AccountsScreen} options={{ tabBarLabel: 'حساب‌ها' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'تنظیمات' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={Tabs} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: 1, height: Platform.OS === 'ios' ? 85 : 65, paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 8 },
  addBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 18, elevation: 8 },
});