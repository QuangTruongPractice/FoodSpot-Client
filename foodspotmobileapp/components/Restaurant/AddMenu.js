import React, { useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  Paragraph,
  IconButton,
  Switch,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MyUserContext } from '../../configs/MyContexts';
import { authApis, endpoints } from '../../configs/Apis';
import Toast from 'react-native-toast-message';
import MyStyles from '../../styles/MyStyles';

const AddMenu = () => {
  const [user] = useContext(MyUserContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId } = route.params || {};
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    time_serve: 'MORNING',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  console.log('🔍 Restaurant ID:', restaurantId); // Debug restaurantId

  const handleAddMenu = async () => {
    if (!menuForm.name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Tên menu không được để trống!',
      });
      return;
    }

    if (menuForm.name.length > 255) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Tên menu không được vượt quá 255 ký tự!',
      });
      return;
    }

    if (!['MORNING', 'NOON', 'EVENING', 'NIGHT'].includes(menuForm.time_serve)) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Thời gian phục vụ phải là MORNING, NOON, EVENING hoặc NIGHT!',
      });
      return;
    }

    if (!restaurantId) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không tìm thấy ID nhà hàng!',
      });
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      if (!token || !user || user.role !== 'RESTAURANT_USER') {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Vui lòng đăng nhập lại!',
        });
        navigation.navigate('Login');
        return;
      }

      const authApi = authApis(token);
      const menuPayload = {
        ...menuForm,
        restaurant: parseInt(restaurantId, 10), // Sửa thành restaurant và đảm bảo là số nguyên
        foods: [],
      };

      console.log('📤 Sending menu payload:', menuPayload);
      const response = await authApi.post(endpoints['menus'], menuPayload);
      console.log('📥 Response:', response.data);

      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: `Menu "${menuForm.name}" đã được tạo!`,
      });
      navigation.navigate('ManageMenus', { restaurantId });
    } catch (ex) {
      let errorMessage = ex.message || 'Không thể thêm menu!';
      if (ex.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập hết hạn!';
        await AsyncStorage.removeItem('access_token');
        navigation.navigate('Login');
      } else if (ex.response?.status === 400) {
        errorMessage = ex.response.data?.detail || JSON.stringify(ex.response.data);
      } else if (ex.response?.status === 403) {
        errorMessage = 'Bạn không có quyền thêm menu!';
      }
      console.error('Lỗi thêm menu:', ex.response?.data || ex.message);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[MyStyles.container, styles.container]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Title style={styles.title}>Thêm Menu Mới</Title>
      </View>
      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Tên Menu"
            value={menuForm.name}
            onChangeText={(text) => setMenuForm({ ...menuForm, name: text })}
            style={styles.input}
            mode="outlined"
            placeholder="Nhập tên menu"
            dense
            autoCapitalize="sentences"
            maxLength={255}
          />
        <TextInput
            label="Mô tả"
            value={menuForm.description}
            onChangeText={(text) => setMenuForm({ ...menuForm, description: text })}
            style={styles.multilineInput}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Nhập mô tả (tùy chọn)"
            dense
            autoCapitalize="sentences"
          />
          <TextInput
            label="Thời gian phục vụ"
            value={menuForm.time_serve}
            onChangeText={(text) => setMenuForm({ ...menuForm, time_serve: text })}
            style={styles.input}
            mode="outlined"
            placeholder="VD: MORNING, NOON, EVENING, NIGHT"
            dense
            autoCapitalize="characters"
          />
          <View style={styles.switchContainer}>
            <Paragraph style={styles.switchLabel}>Kích hoạt</Paragraph>
            <Switch
              value={menuForm.is_active}
              onValueChange={(value) => setMenuForm({ ...menuForm, is_active: value })}
              trackColor={{ false: '#767577', true: '#e6ffed' }}
              thumbColor={menuForm.is_active ? '#2e7d32' : '#d32f2f'}
            />
          </View>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
          >
            Hủy
          </Button>
          <Button
            mode="contained"
            onPress={handleAddMenu}
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
            loading={loading}
            disabled={loading}
          >
            Thêm
          </Button>
        </Card.Actions>
      </Card>
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
    paddingVertical: 8,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  multilineInput: {
    marginBottom: 8,
    backgroundColor: '#fff',
    minHeight: 80,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: '#555',
  },
  actions: {
    justifyContent: 'flex-end',
    padding: 8,
  },
  actionButton: {
    marginLeft: 8,
    borderRadius: 8,
    minWidth: 100,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AddMenu;