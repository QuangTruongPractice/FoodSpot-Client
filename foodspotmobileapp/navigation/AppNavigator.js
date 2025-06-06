import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import NotificationScreen from '../src/screens/NotificationScreen';
import NotificationBadge from '../src/components/NotificationBadge';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const NotificationStack = () => (
    <Stack.Navigator>
        <Stack.Screen
            name="Notifications"
            component={NotificationScreen}
            options={{
                headerShown: false,
            }}
        />
    </Stack.Navigator>
);

const AppNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Notifications') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Icon name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationStack}
                options={{
                    headerShown: false,
                    tabBarBadge: () => <NotificationBadge />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileStack}
                options={{
                    headerShown: false,
                }}
            />
        </Tab.Navigator>
    );
};

export default AppNavigator; 