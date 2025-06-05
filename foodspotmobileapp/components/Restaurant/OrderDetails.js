import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Alert, 
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Image 
} from 'react-native';
import { 
  ActivityIndicator, 
  Card, 
  Button, 
  Surface, 
  Divider, 
  Chip,
  Avatar
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from '../../configs/Apis';
import MyStyles from '../../styles/MyStyles';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const OrderDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params;
  
  const [orderDetails, setOrderDetails] = useState([]);
  const [orderInfo, setOrderInfo] = useState(null);
  const [foodsInfo, setFoodsInfo] = useState({}); // Lưu thông tin chi tiết các món ăn
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Hàm lấy thông tin chi tiết món ăn
  const loadFoodDetails = useCallback(async (foodId, token) => {
    try {
      const response = await authApis(token).get(endpoints['food-details'](foodId));
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin món ăn ${foodId}:`, error);
      return null;
    }
  }, []);

  // Hàm lấy giá món ăn theo thời gian phục vụ
  const getFoodPrice = (foodData, timeServe) => {
    if (!foodData || !foodData.prices || !Array.isArray(foodData.prices)) {
      return 0;
    }
    
    const priceObj = foodData.prices.find(p => p.time_serve === timeServe);
    return priceObj ? priceObj.price : (foodData.prices[0]?.price || 0);
  };

  const loadOrderDetails = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      // Load order details
      const detailsRes = await authApis(token).get(
        endpoints['by-order'](orderId)
      );
      
      // Ensure data is array and properly formatted
      const detailsData = Array.isArray(detailsRes.data) ? detailsRes.data : [];
      setOrderDetails(detailsData);

      // Load order info
      try {
        const orderRes = await authApis(token).get(
          endpoints['orders-info'](orderId)
        );
        setOrderInfo(orderRes.data);
      } catch (orderError) {
        console.log('Thông tin đơn hàng không khả dụng:', orderError);
      }

      // Load thông tin chi tiết cho từng món ăn
      const foodsInfoMap = {};
      const foodPromises = detailsData.map(async (item) => {
        if (item.food) {
          const foodData = await loadFoodDetails(item.food.id, token);
          if (foodData) {
            foodsInfoMap[item.food] = foodData;
          }
        }
      });

      await Promise.all(foodPromises);
      setFoodsInfo(foodsInfoMap);

    } catch (error) {
      console.error('Lỗi khi tải chi tiết đơn hàng:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết đơn hàng.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, loadFoodDetails]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrderDetails();
  }, [loadOrderDetails]);

  const formatCurrency = (amount) => {
    // Ensure amount is a number
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getTotalAmount = () => {
    return orderDetails.reduce((sum, item) => {
      const subTotal = Number(item.sub_total) || 0;
      return sum + subTotal;
    }, 0);
  };

  const getTotalQuantity = () => {
    return orderDetails.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      return sum + quantity;
    }, 0);
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
      default: return String(status || 'N/A');
    }
  };

  const getTimeServeText = (timeServe) => {
    switch (timeServe) {
      case 'MORNING': return 'Sáng';
      case 'NOON': return 'Trưa';
      case 'AFTERNOON': return 'Chiều';
      case 'NIGHT': return 'Tối';
      default: return String(timeServe || 'N/A');
    }
  };

  const renderOrderSummary = () => (
    <Surface style={styles.summaryCard} elevation={3}>
      <View style={styles.summaryHeader}>
        <View>
          <Text style={styles.summaryTitle}>Đơn hàng #{String(orderId)}</Text>
          {orderInfo && (
            <Text style={styles.summaryDate}>
              {formatDate(orderInfo.ordered_date)}
            </Text>
          )}
        </View>
        {orderInfo?.status && (
          <Chip
            style={[
              styles.statusChip, 
              { backgroundColor: getStatusColor(orderInfo.status) }
            ]}
            textStyle={styles.statusChipText}
          >
            {getStatusText(orderInfo.status)}
          </Chip>
        )}
      </View>

      <Divider style={styles.divider} />

      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <Icon name="restaurant" size={20} color="#6200EE" />
          <Text style={styles.statNumber}>{orderDetails.length}</Text>
          <Text style={styles.statLabel}>Món ăn</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Icon name="shopping-cart" size={20} color="#6200EE" />
          <Text style={styles.statNumber}>{getTotalQuantity()}</Text>
          <Text style={styles.statLabel}>Số lượng</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Icon name="attach-money" size={20} color="#6200EE" />
          <Text style={styles.statNumber}>{formatCurrency(getTotalAmount())}</Text>
          <Text style={styles.statLabel}>Tổng tiền</Text>
        </View>
      </View>

      {orderInfo?.user_email && (
        <>
          <Divider style={styles.divider} />
          <View style={styles.customerInfo}>
            <Icon name="person" size={18} color="#666" />
            <Text style={styles.customerText}>{String(orderInfo.user_email)}</Text>
          </View>
        </>
      )}
    </Surface>
  );

  const renderDetail = ({ item, index }) => {
    // Lấy thông tin chi tiết món ăn từ foodsInfo
    const foodData = foodsInfo[item.food] || {};
    
    // Thông tin cơ bản
    const foodName = foodData.name || item.food_name || `Món ăn #${item.food || 'N/A'}`;
    const quantity = Number(item.quantity) || 0;
    const timeServe = String(item.time_serve || 'N/A');
    const subTotal = Number(item.sub_total) || 0;
    
    // Thông tin bổ sung từ API
    const restaurantName = foodData.restaurant_name || 'N/A';
    const categoryName = foodData.food_category_name || 'N/A';
    const description = foodData.description || '';
    const starRating = foodData.star_rating || 0;
    const unitPrice = getFoodPrice(foodData, item.time_serve);
    const isAvailable = foodData.is_available;

    return (
      <Card style={styles.detailCard}>
        <Card.Content>
          <View style={styles.foodHeader}>
            {foodData.image ? (
              <Image 
                source={{ uri: foodData.image }} 
                style={styles.foodImage}
                resizeMode="cover"
              />
            ) : (
              <Avatar.Text 
                size={50} 
                label={String(index + 1)} 
                style={styles.foodAvatar}
                labelStyle={styles.foodAvatarText}
              />
            )}
            
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{String(foodName)}</Text>
              
              <View style={styles.foodMetadata}>
                {!isAvailable && (
                  <Chip 
                    style={styles.unavailableChip} 
                    textStyle={styles.unavailableChipText}
                    compact
                  >
                    Hết hàng
                  </Chip>
                )}
              </View>
              
              {restaurantName !== 'N/A' && (
                <Text style={styles.restaurantName}>
                  <Icon name="store" size={12} color="#666" /> {restaurantName}
                </Text>
              )}
              
              {categoryName !== 'N/A' && (
                <Text style={styles.categoryName}>
                  <Icon name="category" size={12} color="#666" /> {categoryName}
                </Text>
              )}
              
              {starRating > 0 && (
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={14} color="#FFC107" />
                  <Text style={styles.ratingText}>{starRating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>

          {description && (
            <Text style={styles.foodDescription} numberOfLines={2}>
              {description}
            </Text>
          )}

          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="add-shopping-cart" size={16} color="#666" />
                <Text style={styles.detailLabel}>Số lượng</Text>
                <Text style={styles.detailValue}>{quantity}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Icon name="schedule" size={16} color="#666" />
                <Text style={styles.detailLabel}>Thời gian</Text>
                <Text style={styles.detailValue}>{getTimeServeText(timeServe)}</Text>
              </View>
              
              {unitPrice > 0 && (
                <View style={styles.detailItem}>
                  <Icon name="monetization-on" size={16} color="#666" />
                  <Text style={styles.detailLabel}>Đơn giá</Text>
                  <Text style={styles.detailValue}>{formatCurrency(unitPrice)}</Text>
                </View>
              )}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Thành tiền:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(subTotal)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="receipt-long" size={80} color="#E0E0E0" />
      <Text style={styles.emptyStateTitle}>Không có chi tiết</Text>
      <Text style={styles.emptyStateSubtitle}>
        Đơn hàng này chưa có thông tin chi tiết
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
        <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6200EE']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderOrderSummary()}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chi tiết món ăn</Text>
        </View>

        {orderDetails.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={orderDetails}
            renderItem={renderDetail}
            keyExtractor={(item, index) => `${item.id || index}`}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6200EE',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  refreshHeaderButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusChip: {
    marginLeft: 10,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  customerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  sectionHeader: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailCard: {
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  foodAvatar: {
    backgroundColor: '#6200EE',
    marginRight: 12,
  },
  foodAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  foodMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  foodId: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  unavailableChip: {
    backgroundColor: '#F44336',
    height: 20,
  },
  unavailableChipText: {
    color: 'white',
    fontSize: 10,
  },
  restaurantName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  foodDescription: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 15,
    lineHeight: 18,
  },
  detailsGrid: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  detailLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  listContainer: {
    paddingBottom: 20,
  },
  footer: {
    padding: 15,
    backgroundColor: 'white',
  },
  backButtonBottom: {
    backgroundColor: '#6200EE',
  },
  backButtonContent: {
    paddingVertical: 8,
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
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
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
  divider: {
    marginVertical: 15,
  },
});

export default OrderDetails;