import {  useState, useEffect } from "react";
import { Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { authApis, endpoints } from "../../configs/Apis";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { checkToken, loadCart, loadSubCart } from "../../configs/Data";
import styles from "../../styles/CartStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatCurrency } from '../../configs/Data';

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
    if (!token) {
      return;
    }
    try {
      const cartRes = await loadCart(token);
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
    const token = await checkToken(nav);
    try {
      const res = await authApis(token).patch(endpoints["update-sub-cart-item"], {
        sub_cart_item_id: sub_cart_item_id,
        quantity: quantity,
      });
      console.info("Update success:", res.data);
      fetchSubCarts();
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
    if (!subCart) return; 
    if (updatedSelectedSubCarts.has(subCartId)) {
      updatedSelectedSubCarts.delete(subCartId);
      subCart.sub_cart_items.forEach(item => updatedSelectedItems.delete(item.id));
    } else {
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
              const token = await checkToken(nav);
              if (selectedSubCarts.size > 0) {
                await authApis(token).post(endpoints["delete-multiple-sub-carts"], {
                  cartId: cartId,
                  ids: Array.from(selectedSubCarts),
                });
              }
              for (let itemId of selectedItems) {
                const parentSubCart = subCarts.find(subCart =>
                  subCart.sub_cart_items.some(item => item.id === itemId)
                );
                if (!selectedSubCarts.has(parentSubCart?.id)) {
                  await authApis(token).post(endpoints["delete-multiple-items"], {
                    cartId: cartId,
                    ids: [itemId], 
                  });
                }
              }
              setSelectedItems(new Set());
              setSelectedSubCarts(new Set());
              const res = await authApis(token).get(endpoints["sub-carts"]);
              if (!res.data || res.data.length === 0) {
                setCartId(null);
              }
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

          {subItem.food.image && (
            <Image source={{ uri: subItem.food.image }} style={styles.image} />
          )}

          <View style={styles.itemInfo}>
            <Text numberOfLines={1} style={styles.foodName}>
              {subItem.food.name}
            </Text>
            <Text style={styles.price}>{formatCurrency(subItem.price)}</Text>
          </View>

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

      <Text style={styles.totalPriceText}>Tổng: {formatCurrency(item.total_price)}</Text>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
  if (subCarts.length === 0) return <View style={styles.emptyContainer}><Text style={MyStyles.m}>Cart Empty</Text></View>;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={subCarts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
          />
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteItems}>
              <Text style={styles.buttonTextWhite}>Xóa</Text>
            </TouchableOpacity>

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
    </SafeAreaView>
  );
};

export default Cart;
