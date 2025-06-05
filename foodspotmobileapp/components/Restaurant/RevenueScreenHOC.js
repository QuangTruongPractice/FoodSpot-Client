// RevenueScreenHOC.js
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PeriodPicker from './PeriodPicker';

const withRevenueScreen = (fetchDataFn, type, errorMessage) => {
  return ({ route }) => {
    const { restaurantId } = route.params;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handlePeriodChange = async (period) => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) throw new Error('Vui lòng đăng nhập!');
        
        const response = await fetchDataFn(restaurantId, period, token);
        console.log('Dữ liệu nhận được:', response.data);
        // Xử lý cấu trúc dữ liệu nested
        const responseData = response.data?.data || response.data;
        console.log('Dữ liệu sau xử lý:', responseData);
        setData(responseData);
      } catch (error) {
        Alert.alert('Lỗi', error.message || errorMessage);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    const renderFoodRevenueTable = () => {
      if (!data || !data.full_food_revenue || data.full_food_revenue.length === 0) {
        return (
          <View style={styles.tableContainer}>
            <Text style={styles.tableTitle}>Thống kê doanh thu theo món ăn</Text>
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>Không có dữ liệu món ăn</Text>
            </View>
          </View>
        );
      }

      // Xử lý dữ liệu có thể là mảng nested
      const foodData = Array.isArray(data.full_food_revenue[0]) ? data.full_food_revenue[0] : data.full_food_revenue;
      console.log('Food data processed:', foodData);

      return (
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Thống kê doanh thu theo món ăn</Text>
          
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.nameColumn]}>TÊN MÓN ĂN</Text>
            <Text style={[styles.headerCell, styles.revenueColumn]}>TỔNG DOANH THU</Text>
            <Text style={[styles.headerCell, styles.orderColumn]}>TỔNG ĐƠN HÀNG</Text>
            <Text style={[styles.headerCell, styles.quantityColumn]}>SỐ LƯỢNG BÁN</Text>
          </View>
          
          {/* Data rows */}
          {foodData.map((item, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
              <Text style={[styles.dataCell, styles.nameColumn]}>
                {item.food_name || 'Không xác định'}
              </Text>
              <Text style={[styles.dataCell, styles.revenueColumn]}>
                {new Intl.NumberFormat('vi-VN').format(item.total_revenue || 0)}
              </Text>
              <Text style={[styles.dataCell, styles.orderColumn]}>
                {item.order_count || 0}
              </Text>
              <Text style={[styles.dataCell, styles.quantityColumn]}>
                {item.total_quantity || 0}
              </Text>
            </View>
          ))}
        </View>
      );
    };

    const renderCategoryRevenueTable = () => {
      if (!data || !data.category_revenue || data.category_revenue.length === 0) {
        return (
          <View style={styles.tableContainer}>
            <Text style={styles.tableTitle}>Thống kê doanh thu theo danh mục</Text>
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>Không có dữ liệu danh mục</Text>
            </View>
          </View>
        );
      }

      // Xử lý dữ liệu có thể là mảng nested
      const categoryData = Array.isArray(data.category_revenue[0]) ? data.category_revenue[0] : data.category_revenue;
      console.log('Category data processed:', categoryData);

      return (
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Thống kê doanh thu theo danh mục</Text>
          
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.nameColumn]}>TÊN DANH MỤC</Text>
            <Text style={[styles.headerCell, styles.revenueColumn]}>TỔNG DOANH THU</Text>
            <Text style={[styles.headerCell, styles.orderColumn]}>TỔNG ĐƠN HÀNG</Text>
            <Text style={[styles.headerCell, styles.quantityColumn]}>SỐ MÓN ĂN</Text>
          </View>
          
          {/* Data rows */}
          {data.category_revenue.map((item, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
              <Text style={[styles.dataCell, styles.nameColumn]}>
                {item.category_name || 'Không xác định'}
              </Text>
              <Text style={[styles.dataCell, styles.revenueColumn]}>
                {new Intl.NumberFormat('vi-VN').format(item.total_revenue || 0)}
              </Text>
              <Text style={[styles.dataCell, styles.orderColumn]}>
                {item.order_count || 0}
              </Text>
              <Text style={[styles.dataCell, styles.quantityColumn]}>
                {item.food_count || 0}
              </Text>
            </View>
          ))}
        </View>
      );
    };

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fb8c00" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <PeriodPicker onPeriodChange={handlePeriodChange} />
        
        {data && data.summary ? (
          <View>
            <Text style={styles.title}>
              Nhà hàng: {data.restaurant_name || 'Không xác định'}
            </Text>
            <Text style={styles.subtitle}>
              Khoảng thời gian: {data.period || 'Không xác định'}
            </Text>
            
            {/* Summary Info */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng doanh thu:</Text>
                <Text style={styles.summaryValue}>
                  {new Intl.NumberFormat('vi-VN', { 
                    style: 'currency', 
                    currency: 'VND' 
                  }).format(data.summary.total_revenue || 0)}
                </Text>
              </View>
              
              {data.summary.total_orders && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tổng số đơn hàng:</Text>
                  <Text style={styles.summaryValue}>{data.summary.total_orders}</Text>
                </View>
              )}
              
              {data.summary.total_foods && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tổng số món ăn:</Text>
                  <Text style={styles.summaryValue}>{data.summary.total_foods}</Text>
                </View>
              )}
              
              {data.summary.total_categories && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tổng số danh mục:</Text>
                  <Text style={styles.summaryValue}>{data.summary.total_categories}</Text>
                </View>
              )}
            </View>

            {/* Food Revenue Table */}
            {renderFoodRevenueTable()}
            
            {/* Category Revenue Table */}
            {renderCategoryRevenueTable()}
          </View>
        ) : (
          <Text style={styles.noDataText}>
            Vui lòng hoàn tất:{'\n'}
            - Bước 1: Chọn loại thống kê (Tháng, Quý, Năm){'\n'}
            - Bước 2: Chọn thời gian tương ứng{'\n'}
            - Bước 3: Nhấn "Thống kê" để xem dữ liệu.
          </Text>
        )}
      </ScrollView>
    );
  };
};

const styles = StyleSheet.create({
  container: { 
    padding: 10, 
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 20 
  },
  loadingText: { 
    textAlign: 'center', 
    marginTop: 10, 
    fontSize: 16 
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginVertical: 5,
    color: '#333'
  },
  subtitle: { 
    fontSize: 16, 
    marginBottom: 5,
    color: '#666'
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fb8c00',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    overflow: 'hidden',
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: '#fb8c00',
    color: '#fff',
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4a4a4a',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  oddRow: {
    backgroundColor: '#fff',
  },
  dataCell: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
  },
  nameColumn: {
    flex: 2,
    textAlign: 'left',
  },
  revenueColumn: {
    flex: 1.5,
  },
  orderColumn: {
    flex: 1,
  },
  quantityColumn: {
    flex: 1,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: { 
    textAlign: 'center', 
    marginTop: 20, 
    fontSize: 16, 
    lineHeight: 24,
    color: '#999'
  },
});

export default withRevenueScreen;