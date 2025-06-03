import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Switch, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList 
} from 'react-native';
import { MyUserContext } from '../../configs/MyContexts';
import { authApis, endpoints } from '../../configs/Apis';
import { checkToken } from '../../configs/Data';
import MyStyles from '../../styles/MyStyles';

const EditMenu = ({ route, navigation }) => {
  const [user] = useContext(MyUserContext);
  const { menuId } = route.params;
  const [menu, setMenu] = useState({
    name: '',
    description: '',
    time_serve: 'MORNING',
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const timeServeOptions = [
    { value: 'MORNING', label: '🌅 Buổi sáng' },
    { value: 'NOON', label: '☀️ Buổi trưa' },
    { value: 'EVENING', label: '🌆 Buổi tối' },
    { value: 'NIGHT', label: '🌙 Buổi đêm' }
  ];

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const token = await checkToken(navigation);
        if (!token) return;

        const res = await authApis(token).get(endpoints['menus-details'](menuId));
        setMenu({
          name: res.data.name,
          description: res.data.description || '',
          time_serve: res.data.time_serve,
          is_active: res.data.is_active,
        });
      } catch (error) {
        console.error('Lỗi khi tải menu:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin menu.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [menuId, navigation]);

  const handleUpdateMenu = async () => {
    if (!menu.name.trim()) {
      Alert.alert('Lỗi', 'Tên menu không được để trống!');
      return;
    }

    if (!['MORNING', 'NOON', 'EVENING', 'NIGHT'].includes(menu.time_serve)) {
      Alert.alert('Lỗi', 'Thời gian phục vụ phải là MORNING, NOON, EVENING hoặc NIGHT!');
      return;
    }

    setUpdating(true);
    try {
      const token = await checkToken(navigation);
      if (!token) return;

      await authApis(token).patch(endpoints['menus-details'](menuId), menu);
      Alert.alert('Thành công', 'Cập nhật menu thành công!');
      navigation.goBack();
    } catch (error) {
      console.error('Lỗi khi cập nhật menu:', error);
      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể cập nhật menu!');
    } finally {
      setUpdating(false);
    }
  };

  const getSelectedTimeLabel = () => {
    const selectedTime = timeServeOptions.find(option => option.value === menu.time_serve);
    return selectedTime ? selectedTime.label : 'Chọn thời gian phục vụ';
  };

  const handleSelectTime = (timeValue) => {
    setMenu({ ...menu, time_serve: timeValue });
    setShowTimeModal(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Chỉnh Sửa Menu</Text>
        <Text style={styles.subtitle}>Cập nhật thông tin menu của bạn</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Tên menu */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên menu *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên menu"
            placeholderTextColor="#999"
            value={menu.name}
            onChangeText={(text) => setMenu({ ...menu, name: text })}
          />
        </View>

        {/* Mô tả */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả menu</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nhập mô tả chi tiết về menu"
            placeholderTextColor="#999"
            value={menu.description}
            onChangeText={(text) => setMenu({ ...menu, description: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Thời gian phục vụ */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Thời gian phục vụ *</Text>
          <TouchableOpacity
            style={styles.timeSelector}
            onPress={() => setShowTimeModal(true)}
            disabled={loading}
          >
            <Text style={[
              styles.timeSelectorText,
              !menu.time_serve && styles.placeholderText
            ]}>
              {getSelectedTimeLabel()}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Trạng thái kích hoạt */}
        <View style={styles.inputGroup}>
          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.label}>Trạng thái menu</Text>
              <Text style={styles.switchDescription}>
                {menu.is_active ? 'Menu đang được kích hoạt' : 'Menu đang bị tắt'}
              </Text>
            </View>
            <Switch
              value={menu.is_active}
              onValueChange={(value) => setMenu({ ...menu, is_active: value })}
              trackColor={{ false: '#D1D5DB', true: '#34D399' }}
              thumbColor={menu.is_active ? '#10B981' : '#9CA3AF'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
        </View>

        {/* Nút cập nhật */}
        <TouchableOpacity 
          style={[styles.updateButton, updating && styles.updateButtonDisabled]}
          onPress={handleUpdateMenu}
          disabled={updating}
        >
          {updating ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.updateButtonText}>Đang cập nhật...</Text>
            </View>
          ) : (
            <Text style={styles.updateButtonText}>Cập nhật Menu</Text>
          )}
        </TouchableOpacity>

        {/* Nút hủy */}
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
        </TouchableOpacity>
      </View>

      {/* Modal chọn thời gian phục vụ */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn thời gian phục vụ</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTimeModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={timeServeOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    menu.time_serve === item.value && styles.selectedOption
                  ]}
                  onPress={() => handleSelectTime(item.value)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    menu.time_serve === item.value && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                  {menu.time_serve === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  timeSelector: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeSelectorText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: '70%',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#EBF8FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  switchInfo: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EditMenu;