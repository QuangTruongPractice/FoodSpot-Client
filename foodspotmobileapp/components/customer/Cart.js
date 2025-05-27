import {  useState, useEffect } from "react";
import { Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { checkToken, loadCart, loadSubCart } from "../../configs/Data";
import styles from "../../styles/CartStyles";

const Cart = () => {
  const [subCarts, setSubCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectedSubCarts, setSelectedSubCarts] = useState(new Set());
  const [cartId, setCartId] = useState(null);
  const nav = useNavigation();
  const isFocused = useIsFocused();

  const fetchSubCarts = async () => {
    setLoading(true)
    const token = await checkToken(nav);
    try {
      const cartRes = await loadCart(token);
      // Kiểm tra nếu response là dạng không có giỏ hàng
      if (cartRes.message === "Giỏ hàng không tồn tại.") {
        setCartId(null);
        setSubCarts([]);
        return;
      }
      setCartId(cartRes.id);
      const res = await loadSubCart(token);
      setSubCarts(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchSubCarts();
    }
  }, [isFocused]);

  const updateQuantity = async (sub_cart_item_id, quantity) => {
    const token = await AsyncStorage.getItem("token");
    try {
      const res = await authApis(token).patch(endpoints["update-sub-cart-item"], {
        sub_cart_item_id: sub_cart_item_id,
        quantity: quantity,
      });
      console.info("Update success:", res.data);
      fetchSubCarts(); // Sau khi cập nhật, load lại giỏ hàng
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const toggleSelectItem = (itemId) => {
    const updatedItems = new Set(selectedItems);
    const updatedSubCarts = new Set(selectedSubCarts);
  
    if (updatedItems.has(itemId)) {
      updatedItems.delete(itemId);
    } else {
      updatedItems.add(itemId);
    }
    // Sau khi cập nhật selectedItems, kiểm tra lại các subCart
    subCarts.forEach(subCart => {
      const allItemsSelected = subCart.sub_cart_items.every(item => updatedItems.has(item.id));
      if (allItemsSelected) {
        updatedSubCarts.add(subCart.id);
      } else {
        updatedSubCarts.delete(subCart.id);
      }
    });
    setSelectedItems(updatedItems);
    setSelectedSubCarts(updatedSubCarts);
  };

  const toggleSelectSubCart = (subCartId) => {
    const updatedSelectedSubCarts = new Set(selectedSubCarts);
    const updatedSelectedItems = new Set(selectedItems);
  
    // Tìm subCart dựa trên id
    const subCart = subCarts.find((sc) => sc.id === subCartId);
  
    if (!subCart) return; // Nếu không tìm thấy subCart, không làm gì
  
    if (updatedSelectedSubCarts.has(subCartId)) {
      // Nếu đã chọn rồi -> bỏ chọn subCart và tất cả item bên trong
      updatedSelectedSubCarts.delete(subCartId);
      subCart.sub_cart_items.forEach(item => updatedSelectedItems.delete(item.id));
    } else {
      // Nếu chưa chọn -> chọn subCart và tất cả item bên trong
      updatedSelectedSubCarts.add(subCartId);
      subCart.sub_cart_items.forEach(item => updatedSelectedItems.add(item.id));
    }
    setSelectedSubCarts(updatedSelectedSubCarts);
    setSelectedItems(updatedSelectedItems);
  };

  const handleDeleteItems = () => {
    if (selectedItems.size === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một sản phẩm để xóa!");
      return;
    }
    Alert.alert(
      "Xác nhận",
      "Mặt hàng xóa sẽ không thể khôi phục. Bạn có chắc chắn muốn xóa không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              // Xóa toàn bộ subCart nếu được chọn
              if (selectedSubCarts.size > 0) {
                await authApis(token).post(endpoints["delete-multiple-sub-carts"], {
                  cartId: cartId,
                  ids: Array.from(selectedSubCarts),
                });
              }
              // Xóa các item riêng lẻ (không nằm trong subCart đã xóa)
              for (let itemId of selectedItems) {
                const parentSubCart = subCarts.find(subCart =>
                  subCart.sub_cart_items.some(item => item.id === itemId)
                );
                if (!selectedSubCarts.has(parentSubCart?.id)) {
                  await authApis(token).post(endpoints["delete-multiple-items"], {
                    cartId: cartId,
                    ids: [itemId], // chỉ gửi từng item chưa nằm trong subCart đã xóa
                  });
                }
              }
              // Reset selections
              setSelectedItems(new Set());
              setSelectedSubCarts(new Set());
  
              // Gọi lại API để kiểm tra giỏ hàng còn không
              const res = await authApis(token).get(endpoints["sub-carts"]);
              if (!res.data || res.data.length === 0) {
                // Nếu không còn subCart nào, có thể cart đã bị xóa
                setCartId(null);
              }
              // Reload subCart (cập nhật UI)
              fetchSubCarts();
            } catch (error) {
              console.error("Delete failed:", error);
              Alert.alert("Lỗi", "Không thể xóa. Vui lòng thử lại sau.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.subCartContainer}>
      {/* Checkbox chọn nguyên sub-cart */}
      <TouchableOpacity 
        style={styles.checkboxSubCart}
        onPress={() => toggleSelectSubCart(item.id)}
      >
        <Ionicons
          name={selectedSubCarts.has(item.id) ? "checkbox" : "square-outline"}
          size={24}
          color="black"
        />
      </TouchableOpacity>

      <Text style={styles.storeName}>{item.restaurant_name}</Text>

      {item.sub_cart_items.map((subItem) => (
        <View key={subItem.id} style={styles.itemContainer}>
          {/* Checkbox chọn từng item */}
          <TouchableOpacity
            style={styles.checkboxItem}
            onPress={() => toggleSelectItem(subItem.id)}
          >
            <Ionicons
              name={selectedItems.has(subItem.id) ? "checkbox" : "square-outline"}
              size={20}
              color="black"
            />
          </TouchableOpacity>

          {/* Hình món ăn */}
          {subItem.food.image && (
            <Image source={{ uri: subItem.food.image }} style={styles.image} />
          )}

          {/* Thông tin món */}
          <View style={styles.itemInfo}>
            <Text numberOfLines={1} style={styles.foodName}>
              {subItem.food.name}
            </Text>
            <Text style={styles.price}>{subItem.price}đ</Text>
          </View>

          {/* Cột số lượng + nút + - */}
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => updateQuantity(subItem.id, - 1)}
              disabled={subItem.quantity <= 1}
            >
              <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.quantity}>{subItem.quantity}</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => updateQuantity(subItem.id, 1)}
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={styles.totalPriceText}>Tổng: {item.total_price}đ</Text>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (subCarts.length === 0) return <View style={styles.emptyContainer}><Text style={MyStyles.m}>Cart Empty</Text></View>;

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={subCarts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
          />

          {/* Nhóm nút Xóa + Thanh toán */}
          <View style={styles.buttonGroup}>
            {/* Nút Xóa */}
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteItems}>
              <Text style={styles.buttonTextWhite}>Xóa</Text>
            </TouchableOpacity>

            {/* Nút Đặt hàng */}
            <TouchableOpacity style={styles.checkoutButton} 
              onPress={() => {
                const selectedCartData = subCarts
                  .filter(sc => selectedSubCarts.has(sc.id))
                  .map(sc => ({
                    id: sc.id,
                    restaurant: sc.restaurant,
                    restaurant_name: sc.restaurant_name,
                    total_price: sc.total_price,
                    sub_cart_items: sc.sub_cart_items.filter(item => selectedItems.has(item.id)),
                  }));
              
                if (selectedCartData.length === 0) {
                  Alert.alert("Thông báo", "Vui lòng chọn ít nhất một nhà hàng để đặt hàng.");
                  return;
                }
              
                nav.navigate("Checkout", { cart: selectedCartData });
              }}>
              <Text style={styles.checkoutText}>Đặt hàng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default Cart;
