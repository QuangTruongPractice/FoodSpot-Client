import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import { endpoints } from '../../configs/Apis';
import Apis, { authApis, endpoints } from './Apis';



export const notificationService = {
    getNotifications: async () => {
        try {
            const response = await axios.get(endpoints['notifications']);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    markAsRead: async (notificationId) => {
        if (!notificationId) return null;
        try {
            const response = await axios.post(endpoints['mark-as-read'](notificationId));
            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    markAllAsRead: async () => {
        try {
            const response = await axios.post(endpoints['mark-all-as-read']);
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },

    getUnreadCount: async () => {
        try {
            const response = await axios.get(endpoints['unread-count']);
            return response.data?.count || 0;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }
};


// Hàm retry request
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

    const fetchNotifications = async () => {
        try {
            const response = await notificationService.getNotifications();
            
            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            
            // Kiểm tra response và response.data
            if (!response || !response.data) {
                console.warn('Invalid response from API');
                setNotifications([]);
                return;
            }

            // Đảm bảo response.data là một mảng
            const data = Array.isArray(response.data) ? response.data : [];
            console.log('Processed data:', JSON.stringify(data, null, 2));
            
            // Xử lý dữ liệu an toàn
            const formattedData = data.reduce((acc, notification) => {
                if (notification && typeof notification === 'object') {
                    const formattedNotification = {
                        id: notification.id || Math.random().toString(),
                        title: notification.title || 'Thông báo',
                        message: notification.message || '',
                        created_at: notification.created_at || new Date().toISOString(),
                        is_read: Boolean(notification.is_read)
                    };
                    console.log('Formatted notification:', JSON.stringify(formattedNotification, null, 2));
                    acc.push(formattedNotification);
                }
                return acc;
            }, []);

            console.log('Final formatted data:', JSON.stringify(formattedData, null, 2));
            setNotifications(formattedData);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            
            let errorMessage = 'Không thể tải thông báo. Vui lòng thử lại!';
            
            if (error.response) {
                // Lỗi từ server
                errorMessage = error.response.data?.message || errorMessage;
            } else if (error.request) {
                // Lỗi mạng
                errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối!';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Kết nối quá thời gian. Vui lòng thử lại!';
            }
            
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: errorMessage
            });
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleMarkAsRead = async (notificationId) => {
        if (!notificationId) {
            console.warn('Invalid notification ID');
            return;
        }
        
        try {
            const response = await notificationService.markAsRead(notificationId);
            console.log('Mark as read response:', response.data);
            
            setNotifications(prevNotifications => 
                prevNotifications.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, is_read: true }
                        : notification
                )
            );
            Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Đã đánh dấu thông báo đã đọc'
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            let errorMessage = 'Không thể đánh dấu thông báo đã đọc';
            
            if (error.response) {
                errorMessage = error.response.data?.message || errorMessage;
            } else if (error.request) {
                errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối!';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Kết nối quá thời gian. Vui lòng thử lại!';
            }
            
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: errorMessage
            });
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!notifications.length) {
            return;
        }

        try {
            const response = await notificationService.markAllAsRead();
            console.log('Mark all as read response:', response.data);
            
            setNotifications(prevNotifications => 
                prevNotifications.map(notification => ({
                    ...notification,
                    is_read: true
                }))
            );
            Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Đã đánh dấu tất cả thông báo đã đọc'
            });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            let errorMessage = 'Không thể đánh dấu tất cả thông báo đã đọc';
            
            if (error.response) {
                errorMessage = error.response.data?.message || errorMessage;
            } else if (error.request) {
                errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối!';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Kết nối quá thời gian. Vui lòng thử lại!';
            }
            
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: errorMessage
            });
        }
    };

    const renderNotificationItem = ({ item }) => {
        if (!item || typeof item !== 'object') {
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
                    <Text style={styles.notificationMessage}>{item.message}</Text>
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

    const hasUnreadNotifications = notifications.some(notification => 
        notification && typeof notification === 'object' && !notification.is_read
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Thông báo</Text>
                {hasUnreadNotifications && (
                    <TouchableOpacity
                        style={styles.markAllButton}
                        onPress={handleMarkAllAsRead}
                    >
                        <Text style={styles.markAllButtonText}>Đánh dấu đã đọc tất cả</Text>
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
                        <Text style={styles.emptyText}>Không có thông báo nào</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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