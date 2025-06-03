import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput
} from 'react-native';
import { MyUserContext } from '../../configs/MyContexts';
import { authApis, endpoints } from '../../configs/Apis';
import { checkToken } from '../../configs/Data';
import MyStyles from '../../styles/MyStyles';

const AddMenu = ({ route, navigation }) => {
  const [user] = useContext(MyUserContext);
  const { menuId, restaurantId } = route.params;
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const loadFoods = async () => {
      try {
        const token = await checkToken(navigation);
        if (!token) return;

        const res = await authApis(token).get(endpoints['foods'], {
          params: { restaurant_id: restaurantId },
        });
        const foodData = res.data.results || res.data;
        setFoods(foodData);
        setFilteredFoods(foodData);
      } catch (error) {
        console.error('Lỗi khi tải danh sách món ăn:', error);
        Alert.alert('Lỗi', 'Không thể tải danh sách món ăn.');
      } finally {
        setLoading(false);
      }
    };

    loadFoods();
  }, [restaurantId, navigation]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredFoods(foods);
    } else {
      const filtered = foods.filter(food =>
        food.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredFoods(filtered);
    }
  }, [searchText, foods]);

  const handleAddFoodToMenu = async () => {
    if (!selectedFood) {
      Alert.alert('Lỗi', 'Vui lòng chọn một món ăn!');
      return;
    }

    setAdding(true);
    try {
      const token = await checkToken(navigation);
      if (!token) return;

      const payload = { food_id: selectedFood.id };
      await authApis(token).post(endpoints['add-food-to-menu'](menuId), payload);
      Alert.alert('Thành công', 'Thêm món ăn vào menu thành công!');
      navigation.goBack();
    } catch (error) {
      console.error('Lỗi khi thêm món ăn:', error);
      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể thêm món ăn vào menu!');
    } finally {
      setAdding(false);
    }
  };

  const getSelectedFoodName = () => {
    return selectedFood ? selectedFood.name : 'Chọn món ăn';
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setShowFoodModal(false);
    setSearchText('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải danh sách món ăn...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Thêm Món Ăn Vào Menu</Text>
        <Text style={styles.subtitle}>Chọn món ăn để thêm vào menu của bạn</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Chọn món ăn */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Chọn món ăn *</Text>
          <TouchableOpacity
            style={styles.foodSelector}
            onPress={() => setShowFoodModal(true)}
            disabled={loading || foods.length === 0}
          >
            <Text style={[
              styles.foodSelectorText,
              !selectedFood && styles.placeholderText
            ]}>
              {getSelectedFoodName()}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          
          {foods.length === 0 && !loading && (
            <Text style={styles.noFoodsText}>
              Không có món ăn nào để thêm vào menu
            </Text>
          )}
        </View>

        {/* Thông tin món ăn đã chọn */}
        {selectedFood && (
          <View style={styles.selectedFoodInfo}>
            <Text style={styles.selectedFoodTitle}>Món ăn đã chọn:</Text>
            <View style={styles.foodCard}>
              <Text style={styles.foodName}>{selectedFood.name}</Text>
              {selectedFood.description && (
                <Text style={styles.foodDescription}>{selectedFood.description}</Text>
              )}
              {selectedFood.price && (
                <Text style={styles.foodPrice}>
                  Giá: {selectedFood.price.toLocaleString('vi-VN')} VNĐ
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Nút thêm vào menu */}
        <TouchableOpacity 
          style={[
            styles.addButton, 
            (!selectedFood || adding) && styles.addButtonDisabled
          ]}
          onPress={handleAddFoodToMenu}
          disabled={!selectedFood || adding}
        >
          {adding ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.addButtonText}>Đang thêm...</Text>
            </View>
          ) : (
            <Text style={styles.addButtonText}>Thêm vào Menu</Text>
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

      {/* Modal chọn món ăn */}
      <Modal
        visible={showFoodModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn món ăn</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowFoodModal(false);
                  setSearchText('');
                }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Thanh tìm kiếm */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm món ăn..."
                placeholderTextColor="#9CA3AF"
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            <FlatList
              data={filteredFoods}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedFood?.id === item.id && styles.selectedOption
                  ]}
                  onPress={() => handleSelectFood(item)}
                >
                  <View style={styles.foodOptionContent}>
                    <Text style={[
                      styles.modalOptionText,
                      selectedFood?.id === item.id && styles.selectedOptionText
                    ]}>
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text style={styles.foodOptionDescription}>
                        {item.description}
                      </Text>
                    )}
                    {item.price && (
                      <Text style={styles.foodOptionPrice}>
                        {item.price.toLocaleString('vi-VN')} VNĐ
                      </Text>
                    )}
                  </View>
                  {selectedFood?.id === item.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchText ? 'Không tìm thấy món ăn nào' : 'Không có món ăn nào'}
                  </Text>
                </View>
              )}
              showsVerticalScrollIndicator={false}
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
  foodSelector: {
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
  foodSelectorText: {
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
  noFoodsText: {
    fontSize: 14,
    color: '#EF4444',
    fontStyle: 'italic',
    marginTop: 5,
  },
  selectedFoodInfo: {
    marginBottom: 25,
  },
  selectedFoodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  foodCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
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
  foodName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  foodDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  foodPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  addButton: {
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
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
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
    maxHeight: '80%',
    width: '90%',
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  foodOptionContent: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 2,
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  foodOptionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
    lineHeight: 16,
  },
  foodOptionPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default AddMenu;