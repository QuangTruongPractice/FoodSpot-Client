import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet,} from "react-native";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";

const MenuDetails = ({ route }) => {
  const { menuId } = route.params;
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();

  const loadMenu = async () => {
    try {
      setLoading(true)
      const res = await Apis.get(endpoints["menus-details"](menuId));
      setMenu(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [menuId]);

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
              <Text style={styles.foodPrice}>{item.price ? item.price.toLocaleString() + "đ" : "Đang cập nhật giá"}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Không có món ăn trong menu này.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff", flex: 1 },
  menuTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 8, color: "#e53935" },
  menuDesc: { fontSize: 14, color: "#555", marginBottom: 16 },
  card: { flexDirection: "row", backgroundColor: "#f9f9f9", borderRadius: 10, marginBottom: 15, overflow: "hidden", elevation: 2 },
  image: { width: 100, height: 100 },
  cardContent: { flex: 1, padding: 10, justifyContent: "space-between" },
  foodName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  foodDesc: { fontSize: 13, color: "#666", marginVertical: 4 },
  foodPrice: { fontSize: 14, fontWeight: "bold", color: "#e53935" },
  errorText: { textAlign: "center", marginTop: 20, color: "#888" },
  emptyText: { textAlign: "center", marginTop: 20, color: "#888" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default MenuDetails;
