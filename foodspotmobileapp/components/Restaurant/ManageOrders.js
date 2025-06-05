import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Alert, 
  RefreshControl,
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { MyUserContext } from "../../configs/MyContexts";
import { authApis, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MyStyles from '../../styles/MyStyles';
import { 
  ActivityIndicator, 
  Card, 
  Chip, 
  Button,
  Divider,
  Surface,
  IconButton
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import OrderDetails from './OrderDetails';

const { width } = Dimensions.get('window');

const ManageOrders = ({ route }) => {
  const [user] = useContext(MyUserContext);
  const { restaurants } = route.params || {};
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const navigation = useNavigation();

  const loadOrders = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await authApis(token).get(endpoints['orders-current-restaurant']);
      setOrders(res.data.results || res.data);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      await authApis(token).patch(endpoints['orders-info'](orderId), { status });
      
      setOrders(prevOrders =>
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status } : order
        )
      );
      
      Alert.alert('Thành công', `Đơn hàng đã được cập nhật thành ${getStatusText(status)}`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng!');
      console.error('Error updating order status:', error);
    }
  };

  const handleViewDetails = (orderId) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'ACCEPTED': return '#2196F3';
      case 'DELIVERED': return '#4CAF50';
      case 'CANCEL': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'ACCEPTED': return 'Đã chấp nhận';
      case 'DELIVERED': return 'Đã giao hàng';
      case 'CANCEL': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return 'schedule';
      case 'ACCEPTED': return 'check-circle';
      case 'DELIVERED': return 'local-shipping';
      case 'CANCEL': return 'cancel';
      default: return 'help';
    }
  };

  const filteredOrders = orders.filter(order => 
    filter === 'ALL' || order.status === filter
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderFilterChips = () => {
    const filters = [
      { key: 'ALL', label: 'Tất cả' },
      { key: 'PENDING', label: 'Chờ xử lý' },
      { key: 'ACCEPTED', label: 'Đã chấp nhận' },
      { key: 'DELIVERED', label: 'Đã giao' },
      { key: 'CANCEL', label: 'Đã hủy' }
    ];

    return (
      <View style={styles.filterContainer}>
        {filters.map(item => (
          <Chip
            key={item.key}
            selected={filter === item.key}
            onPress={() => setFilter(item.key)}
            style={[
              styles.filterChip,
              filter === item.key && styles.selectedChip
            ]}
            textStyle={filter === item.key && styles.selectedChipText}
          >
            {item.label}
          </Chip>
        ))}
      </View>
    );
  };

  const renderActionButtons = (item) => {
    const buttons = [];

    if (item.status === 'PENDING') {
      buttons.push(
        <Button
          key="accept"
          mode="contained"
          onPress={() => handleUpdateStatus(item.id, 'ACCEPTED')}
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          labelStyle={styles.buttonText}
          icon="check"
          compact
        >
          Chấp nhận
        </Button>
      );
    }

    if (item.status === 'ACCEPTED') {
      buttons.push(
        <Button
          key="deliver"
          mode="contained"
          onPress={() => handleUpdateStatus(item.id, 'DELIVERED')}
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          labelStyle={styles.buttonText}
          icon="local-shipping"
          compact
        >
          Giao hàng
        </Button>
      );
    }

    if (item.status !== 'DELIVERED' && item.status !== 'CANCEL') {
      buttons.push(
        <Button
          key="cancel"
          mode="outlined"
          onPress={() => handleUpdateStatus(item.id, 'CANCEL')}
          style={[styles.actionButton, styles.cancelButton]}
          labelStyle={styles.cancelButtonText}
          icon="cancel"
          compact
        >
          Hủy
        </Button>
      );
    }

    return (
      <View style={styles.actionButtonsContainer}>
        {buttons}
      </View>
    );
  };

  const renderOrder = ({ item }) => (
    <Surface style={styles.orderCard} elevation={2}>
      <TouchableOpacity
        onPress={() => handleViewDetails(item.id)}
        style={styles.orderContent}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderTitleContainer}>
            <Text style={styles.orderId}>#{item.id}</Text>
            <Chip
              icon={() => <Icon name={getStatusIcon(item.status)} size={16} color="white" />}
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
              textStyle={styles.statusChipText}
            >
              {getStatusText(item.status)}
            </Chip>
          </View>
          <IconButton
            icon="chevron-right"
            size={20}
            onPress={() => handleViewDetails(item.id)}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Icon name="person" size={18} color="#666" />
            <Text style={styles.detailText}>
              {item.user_email || 'Khách hàng ẩn danh'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="schedule" size={18} color="#666" />
            <Text style={styles.detailText}>
              {formatDate(item.ordered_date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="attach-money" size={18} color="#666" />
            <Text style={[styles.detailText, styles.totalAmount]}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        </View>

        {renderActionButtons(item)}
      </TouchableOpacity>
    </Surface>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="receipt-long" size={80} color="#E0E0E0" />
      <Text style={styles.emptyStateTitle}>Không có đơn hàng</Text>
      <Text style={styles.emptyStateSubtitle}>
        {filter === 'ALL' 
          ? 'Chưa có đơn hàng nào được tạo'
          : `Không có đơn hàng nào ở trạng thái "${getStatusText(filter)}"`
        }
      </Text>
      <Button
        mode="outlined"
        onPress={onRefresh}
        style={styles.refreshButton}
        icon="refresh"
      >
        Làm mới
      </Button>
    </View>
  );

  if (loading) {
    return (
      <View style={[MyStyles.container, styles.loadingContainer]}>
        <ActivityIndicator animating={true} size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  return (
    <View style={MyStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý Đơn hàng</Text>
        <Text style={styles.subtitle}>
          {filteredOrders.length} đơn hàng
        </Text>
      </View>

      {renderFilterChips()}

      {filteredOrders.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6200EE']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#6200EE',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 15,
    flexWrap: 'wrap',
    backgroundColor: '#F5F5F5',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  selectedChip: {
    backgroundColor: '#6200EE',
  },
  selectedChipText: {
    color: 'white',
  },
  orderCard: {
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  orderContent: {
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  statusChip: {
    marginLeft: 8,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 12,
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 8,
    minWidth: 100,
  },
  cancelButton: {
    borderColor: '#F44336',
  },
  cancelButtonText: {
    color: '#F44336',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  refreshButton: {
    borderColor: '#6200EE',
  },
});

export default ManageOrders;