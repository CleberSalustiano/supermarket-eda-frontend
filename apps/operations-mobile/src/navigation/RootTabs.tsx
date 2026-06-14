import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ChartNoAxesCombined, PackageSearch } from 'lucide-react-native';

import { ManagementOverviewScreen } from '../screens/ManagementOverviewScreen';
import { OperationsInventoryScreen } from '../screens/OperationsInventoryScreen';

const Tab = createBottomTabNavigator();

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1f766e',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          height: 74,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopColor: '#d6d3d1',
          backgroundColor: '#fdfcfb'
        }
      }}
    >
      <Tab.Screen
        name="Inventory"
        component={OperationsInventoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <PackageSearch color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="Manager"
        component={ManagementOverviewScreen}
        options={{
          tabBarIcon: ({ color, size }) => <ChartNoAxesCombined color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}
