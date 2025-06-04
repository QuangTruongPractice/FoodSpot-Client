import { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet,} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { loadMenuDetails } from "../../configs/Data";
import styles from "../../styles/MenuDetailsStyles";
import { IconButton } from "react-native-paper"; 
import { addFoodToCart } from "../../configs/Action";

const MenuDetails = ({ route }) => {
  const { menuId } = route.params;
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();

  const loadMenu = async () => {
    try {
      setLoading(true)
      const res = await loadMenuDetails(menuId);
      setMenu(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [menuId]);

  const handleAddToCart = (foodId) => {
    addFoodToCart({ nav, foodId });
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e53935" />
      </View>
    );

  if (!menu) return <Text style={styles.errorText}>Không tìm thấy menu!</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.menuTitle}>{menu.name}</Text>
      <Text style={styles.menuDesc}>{menu.description}</Text>

      <FlatList
        data={menu.foods}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => nav.navigate("Food", { foodId: item.id })}
          >
            <Image source={{ uri: item.image || "https://picsum.photos/400" }} style={styles.image} />
            <View style={styles.cardContent}>
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodDesc} numberOfLines={2}>{item.description || "Không có mô tả"}</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.foodPrice}>
                  {item.price
                    ? item.price.toLocaleString() + "đ"
                    : "Đang cập nhật giá"}
                </Text>
                <View style={styles.actionButtons}>

                  <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => handleAddToCart(item.id)}
                  >
                    <IconButton
                      icon="cart"
                      size={24}
                      iconColor="#fff"
                      containerColor="#fbc02d"
                      style={{ borderRadius: 8 }}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Không có món ăn trong menu này.</Text>}
      />
    </View>
  );
};

export default MenuDetails;
