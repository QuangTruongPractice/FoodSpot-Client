import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  IconButton,
  Chip,
} from 'react-native-paper';
import { MyUserContext } from '../../configs/MyContexts';
import { authApis, endpoints } from '../../configs/Apis';
import { loadRestaurantMenu, checkToken } from '../../configs/Data';
import MyStyles from '../../styles/MyStyles';
import Toast from 'react-native-toast-message';

const ManageMenus = ({ route, navigation }) => {
  const [user] = useContext(MyUserContext);
  const { restaurantId } = route.params;
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMenusData = async () => {
    try {
      const token = await checkToken(navigation);
      if (!token) return;

      if (!restaurantId || restaurantId.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Không có nhà hàng nào được liên kết với tài khoản!',
        });
        return;
      }
      const menuData = await loadRestaurantMenu(restaurantId);
      setMenus(menuData);
    } catch (error) {
      console.error('Lỗi khi tải menu:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải danh sách menu.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMenusData();
  }, [user, restaurantId, navigation]);

  const handleUpdateMenu = async (menuId, updatedMenu) => {
    try {
      const token = await checkToken(navigation);
      if (!token) return;

      const res = await authApis(token).patch(endpoints['menus-details'](menuId), updatedMenu);
      setMenus(menus.map((menu) => (menu.id === menuId ? res.data : menu)));
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Cập nhật menu thành công!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể cập nhật menu!',
      });
      console.error('Lỗi cập nhật menu:', error);
    }
  };

  const handleDeleteMenu = async (menuId) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa menu này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await checkToken(navigation);
              if (!token) return;

              await authApis(token).delete(endpoints['menus-details'](menuId));
              setMenus(menus.filter((menu) => menu.id !== menuId));
              Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Xóa menu thành công!',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể xóa menu!',
              });
              console.error('Lỗi xóa menu:', error);
            }
          },
        },
      ]
    );
  };

  const toggleMenuStatus = async (menuId, currentStatus) => {
    const updatedMenu = { is_active: !currentStatus };
    await handleUpdateMenu(menuId, updatedMenu);
  };

  const getTimeServeText = (timeServe) => {
    const timeMap = {
      MORNING: 'Buổi sáng',
      NOON: 'Buổi trưa',
      EVENING: 'Buổi tối',
      NIGHT: 'Buổi đêm',
    };
    return timeMap[timeServe] || timeServe;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setMenus([]);
    loadMenusData();
  };

  const renderMenu = ({ item }) => (
    <Card style={styles.menuItem}>
      <Card.Content>
        <View style={styles.menuHeader}>
          <Title style={styles.menuName}>{item.name}</Title>
          <Chip
            selected={item.is_active}
            onPress={() => toggleMenuStatus(item.id, item.is_active)}
            style={styles.statusChip}
            textStyle={{ color: item.is_active ? '#2e7d32' : '#d32f2f' }}
          >
            {item.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
          </Chip>
        </View>
        <Paragraph style={styles.menuInfo}>
          Nhà hàng: {item.restaurant_name || item.restaurant}
        </Paragraph>
        <Paragraph style={styles.menuInfo}>
          Mô tả: {item.description || 'Không có mô tả'}
        </Paragraph>
        <Paragraph style={styles.menuInfo}>
          Thời gian: {getTimeServeText(item.time_serve)}
        </Paragraph>
        <Paragraph style={styles.menuInfo}>
          Số món ăn: {item.foods?.length || 0}
        </Paragraph>
      </Card.Content>
      <Card.Actions style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('AddMenuFood', { menuId: item.id, restaurantId })}
          style={styles.actionButton}
          labelStyle={styles.actionButtonLabel}
          compact
        >
          Thêm món
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('EditMenu', { menuId: item.id })}
          style={styles.actionButton}
          labelStyle={styles.actionButtonLabel}
          compact
        >
          Sửa
        </Button>
        <Button
          mode="outlined"
          onPress={() =>
            navigation.navigate('MenuDetails', { menuId: item.id, restaurantId })
          }
          style={styles.actionButton}
          labelStyle={styles.actionButtonLabel}
          compact
        >
          Chi tiết
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleDeleteMenu(item.id)}
          style={styles.actionButton}
          labelStyle={[styles.actionButtonLabel, { color: '#d32f2f' }]}
          compact
        >
          Xóa
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderLoadingSkeleton = () => (
    <View style={styles.loadingContainer}>
      <View style={[styles.menuItem, styles.skeletonCard]}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonButtonContainer} />
      </View>
      <View style={[styles.menuItem, styles.skeletonCard]}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonButtonContainer} />
      </View>
    </View>
  );

  return (
    <View style={[MyStyles.container, styles.container]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Title style={styles.title}>Quản lý Menu</Title>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('AddMenu', { restaurantId })}
          style={styles.actionHeaderButton}
          labelStyle={styles.buttonLabel}
          icon="plus"
          compact
        >
          Thêm
        </Button>
      </View>
      {loading && menus.length === 0 ? (
        renderLoadingSkeleton()
      ) : (
        <FlatList
          data={menus}
          renderItem={renderMenu}
          keyExtractor={(item) => item.id.toString()}
          style={styles.listContent}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Paragraph style={styles.emptyText}>Chưa có menu nào</Paragraph>
          }
        />
      )}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  actionHeaderButton: {
    borderRadius: 8,
    backgroundColor: '#6200ee',
  },
  buttonLabel: {
    fontSize: 14,
    color: '#fff',
  },
  listContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  listPadding: {
    paddingBottom: 16,
  },
  menuItem: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  menuInfo: {
    fontSize: 13,
    color: '#555',
    marginBottom: 3,
  },
  statusChip: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    padding: 8,
  },
  actionButton: {
    marginLeft: 6,
    marginBottom: 6,
    borderRadius: 6,
    borderColor: '#6200ee',
    minWidth: 80,
  },
  actionButtonLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  skeletonCard: {
    padding: 16,
  },
  skeletonTitle: {
    width: '60%',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonLine: {
    width: '80%',
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#888',
  },
});

export default ManageMenus;