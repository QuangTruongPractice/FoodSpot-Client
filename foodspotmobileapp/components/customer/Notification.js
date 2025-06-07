import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView
} from 'react-native';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import Apis, { endpoints, authApis } from '../../configs/Apis';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Notification Service
export const notificationService = {
    getNotifications: async (token) => {
        try {
            const response = await authApis(token).get(endpoints['notifications']);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },
    markAsRead: async (notificationId, token) => {
        if (!notificationId) return null;
        try {
            const response = await authApis(token).post(endpoints['mark-as-read'](notificationId));
            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },
    markAllAsRead: async (token) => {
        try {
            const response = await authApis(token).post(endpoints['mark-all-as-read']);
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },
    getUnreadCount: async (token) => {
        try {
            const response = await authApis(token).get(endpoints['unread-count']);
            return response.data?.count || 0;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }
};

// Retry Request Utility
const retryRequest = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryRequest(fn, retries - 1, delay);
    }
};

const Notification = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [token, setToken] = useState(null);

    // Load token on component mount
    useEffect(() => {
        const loadToken = async () => {
            try {
                const storedToken = await AsyncStorage.getItem("access_token");
                setToken(storedToken);
            } catch (error) {
                console.error('Error loading token:', error);
            }
        };
        loadToken();
    }, []);

    const fetchNotifications = async () => {
        if (!token) {
            console.warn('No token available');
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            const response = await retryRequest(() => notificationService.getNotifications(token));
            if (!response) {
                console.warn('No response from API');
                setNotifications([]);
                return;
            }
            setNotifications(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load notifications. Please try again!'
            });
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch notifications when token is available
    useEffect(() => {
        if (token) {
            fetchNotifications();
        }
    }, [token]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleMarkAsRead = async (notificationId) => {
        if (!notificationId || !token) {
            console.warn('Invalid notification ID or no token');
            return;
        }
        try {
            await notificationService.markAsRead(notificationId, token);
            setNotifications(prevNotifications =>
                prevNotifications.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, is_read: true }
                        : notification
                )
            );
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Notification marked as read'
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to mark notification as read'
            });
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!token) {
            console.warn('No token available');
            return;
        }
        if (!Array.isArray(notifications)) {
            console.warn('Notifications is not an array');
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Invalid notification data'
            });
            return;
        }
        const unreadNotifications = notifications.filter(n => !n.is_read);
        if (unreadNotifications.length === 0) {
            Toast.show({
                type: 'info',
                text1: 'Info',
                text2: 'No unread notifications'
            });
            return;
        }
        try {
            await notificationService.markAllAsRead(token);
            setNotifications(prevNotifications =>
                prevNotifications.map(notification => ({
                    ...notification,
                    is_read: true
                }))
            );
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'All notifications marked as read'
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to mark all notifications as read'
            });
        }
    };

    const renderNotificationItem = ({ item }) => {
        if (!item || !item.id) {
            console.warn('Invalid notification item:', item);
            return null;
        }
        return (
            <TouchableOpacity
                style={[
                    styles.notificationItem,
                    !item.is_read && styles.unreadNotification
                ]}
                onPress={() => handleMarkAsRead(item.id)}
            >
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationMessage}>{item.message || item.body}</Text>
                    <Text style={styles.notificationTime}>
                        {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
        );
    }

    const hasUnreadNotifications = notifications.some(notification => !notification.is_read);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {hasUnreadNotifications && (
                    <TouchableOpacity
                        style={styles.markAllButton}
                        onPress={handleMarkAllAsRead}
                    >
                        <Text style={styles.markAllButtonText}>Mark All as Read</Text>
                    </TouchableOpacity>
                )}
            </View>
            <FlatList
                data={notifications}
                renderItem={renderNotificationItem}
                keyExtractor={item => item.id.toString()}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#FF6B6B']}
                        tintColor="#FF6B6B"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No notifications available</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: 30 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    markAllButton: {
        padding: 8,
    },
    markAllButtonText: {
        color: '#FF6B6B',
        fontSize: 14,
    },
    notificationItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    unreadNotification: {
        backgroundColor: '#FFF5F5',
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});

export default Notification;