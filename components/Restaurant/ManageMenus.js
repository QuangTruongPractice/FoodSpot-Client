import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, Alert, Switch } from 'react-native';
import { MyUserContext } from '../../configs/MyContexts';
import { authApis, endpoints } from '../../configs/Apis';
import { loadRestaurantMenu, checkToken } from '../../configs/Data';
import MyStyles from '../../styles/MyStyles';

const ManageMenus = ({ route, navigation }) => {
  const [user] = useContext(MyUserContext);
  const {restaurantId} = route.params;
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMenu, setNewMenu] = useState({
    name: '',
    description: '',
    time_serve: 'MORNING',
    is_active: true,
  });

  useEffect(() => {
    const loadMenusData = async () => {
      try {
        // Kiểm tra token trước khi load dữ liệu
        const token = await checkToken(navigation);
        if (!token) return;

        if (!restaurantId || restaurantId.length === 0) {
          Alert.alert('Lỗi', 'Không có nhà hàng nào được liên kết với tài khoản!');
          return;
        }
        const menuData = await loadRestaurantMenu(restaurantId);
        
        setMenus(menuData);
      } catch (error) {
        console.error('Lỗi khi tải menu:', error);
        Alert.alert('Lỗi', 'Không thể tải danh sách menu.');
      } finally {
        setLoading(false);
      }
    };

    loadMenusData();
  }, [user, restaurantId, navigation]);

  const handleAddMenu = async () => {
    if (!newMenu.name.trim()) {
      Alert.alert('Lỗi', 'Tên menu không được để trống!');
      return;
    }

    if (!['MORNING', 'NOON', 'EVENING', 'NIGHT'].includes(newMenu.time_serve)) {
      Alert.alert('Lỗi', 'Thời gian phục vụ phải là MORNING, NOON, EVENING hoặc NIGHT!');
      return;
    }

    try {
      const token = await checkToken(navigation);
      if (!token) return;

      const menuPayload = {
        ...newMenu,
        restaurant: restaurantId,
        foods: [], 
      };

      const res = await authApis(token).post(endpoints['menus'], menuPayload);
      setMenus([...menus, res.data]);
      setNewMenu({ 
        name: '', 
        description: '', 
        time_serve: 'MORNING', 
        is_active: true 
      });
      Alert.alert('Thành công', 'Thêm menu thành công!');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm menu!');
      console.error('Lỗi thêm menu:', error);
    }
  };

  const handleUpdateMenu = async (menuId, updatedMenu) => {
    try {
      const token = await checkToken(navigation);
      if (!token) return;

      const res = await authApis(token).patch(endpoints['menus-details'](menuId), updatedMenu);
      setMenus(menus.map((menu) => (menu.id === menuId ? res.data : menu)));
      Alert.alert('Thành công', 'Cập nhật menu thành công!');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật menu!');
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
              Alert.alert('Thành công', 'Xóa menu thành công!');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa menu!');
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
      'MORNING': 'Buổi sáng',
      'NOON': 'Buổi trưa', 
      'EVENING': 'Buổi tối',
      'NIGHT': 'Buổi đêm'
    };
    return timeMap[timeServe] || timeServe;
  };

  const renderMenu = ({ item }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuHeader}>
        <Text style={styles.menuName}>{item.name}</Text>
        <Switch
          value={item.is_active}
          onValueChange={() => toggleMenuStatus(item.id, item.is_active)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={item.is_active ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>
      
      <Text style={styles.menuInfo}>Nhà hàng: {item.restaurant}</Text>
      <Text style={styles.menuInfo}>Mô tả: {item.description || 'Không có mô tả'}</Text>
      <Text style={styles.menuInfo}>Thời gian: {getTimeServeText(item.time_serve)}</Text>
      <Text style={styles.menuInfo}>Số món ăn: {item.foods?.length || 0}</Text>
      <Text style={styles.menuStatus}>
        Trạng thái: {item.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
      </Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Cập nhật"
          onPress={() =>
            handleUpdateMenu(item.id, {
              name: item.name,
              description: item.description,
              time_serve: item.time_serve,
            })
          }
        />
        <Button 
          title="Xóa" 
          onPress={() => handleDeleteMenu(item.id)} 
          color="red" 
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[MyStyles.container, styles.centerContent]}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={MyStyles.container}>
      <Text style={MyStyles.title}>Quản lý Menu</Text>
      
      <View style={styles.formContainer}>
        <TextInput
          style={MyStyles.input}
          placeholder="Tên menu"
          value={newMenu.name}
          onChangeText={(text) => setNewMenu({ ...newMenu, name: text })}
        />
        <TextInput
          style={MyStyles.input}
          placeholder="Mô tả menu"
          value={newMenu.description}
          onChangeText={(text) => setNewMenu({ ...newMenu, description: text })}
          multiline
          numberOfLines={3}
        />
        <TextInput
          style={MyStyles.input}
          placeholder="Thời gian phục vụ (MORNING/NOON/EVENING/NIGHT)"
          value={newMenu.time_serve}
          onChangeText={(text) => setNewMenu({ ...newMenu, time_serve: text.toUpperCase() })}
        />
        
        <View style={styles.switchContainer}>
          <Text>Kích hoạt menu: </Text>
          <Switch
            value={newMenu.is_active}
            onValueChange={(value) => setNewMenu({ ...newMenu, is_active: value })}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={newMenu.is_active ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
        
        <Button title="Thêm Menu" onPress={handleAddMenu} />
      </View>

      <FlatList
        data={menus}
        renderItem={renderMenu}
        keyExtractor={(item) => item.id.toString()}
        style={styles.menuList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không có menu nào</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  menuList: {
    flex: 1,
    marginTop: 10,
  },
  menuItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  menuInfo: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  menuStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
});

export default ManageMenus;