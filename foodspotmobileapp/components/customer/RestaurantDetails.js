import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import MyStyles from "../../styles/MyStyles";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";

const RestaurantDetails = ({ route }) => {
  const { restaurantId } = route.params;
  const [menus, setMenus] = useState([]);
  const [foods, setFoods] = useState([]);
  const [restaurant, setRestaurant] = useState([]);
  const [activeTab, setActiveTab] = useState("Món ăn");
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const menuRes = await Apis.get(endpoints["restaurant-menus"](restaurantId));
        setMenus(menuRes.data);

        const foodRes = await Apis.get(endpoints["restaurant-foods"](restaurantId));
        setFoods(foodRes.data);

        const res = await Apis.get(endpoints["restaurant-details"](restaurantId));
        setRestaurant(res.data);
      } catch (error) {
        console.error("Error loading restaurant data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);


  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {restaurant && (
        <View style={styles.restaurantCard}>
            <Image
            source={{ uri: restaurant.avatar || "https://picsum.photos/200" }}
            style={styles.restaurantAvatar}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <View style={styles.ratingRow}>
                <Text style={styles.star}>⭐{restaurant.star_rating}</Text>
                <Text style={styles.ratingText}>{restaurant.rating}</Text>
            </View>
            </View>
            <View style={styles.actionsColumn}>
            <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Tin nhắn</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonColor}>
                <Text style={styles.actionButtonTextColor}>Theo dõi</Text>
            </TouchableOpacity>
            </View>
        </View>
        )}

      {/* Tab buttons */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 10,
          backgroundColor: "#fafafa",
        }}
      >
        <TouchableOpacity onPress={() => setActiveTab("Món ăn")}>
          <Text
            style={{
              fontWeight: activeTab === "Món ăn" ? "bold" : "normal",
              color: activeTab === "Món ăn" ? "#e53935" : "#000",
            }}
          >
            Món ăn
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("Menu")}>
          <Text
            style={{
              fontWeight: activeTab === "Menu" ? "bold" : "normal",
              color: activeTab === "Menu" ? "#e53935" : "#000",
            }}
          >
            Menu
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <View style={{ flex: 1, paddingHorizontal: 10, backgroundColor: "#fff" }}>
        {activeTab === "Món ăn" ? (
            <FlatList
            key={"foods"} // buộc render lại khi tab đổi
            data={foods}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => (
                <TouchableOpacity
                style={styles.foodCard}
                onPress={() => nav.navigate("Food", { foodId: item.id })}
                >
                <Image
                    source={{ uri: item.image || "https://picsum.photos/400" }}
                    style={styles.foodImage}
                />
                <Text style={styles.foodName} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={styles.foodPrice}>
                    {item.prices?.length
                    ? Math.min(...item.prices.map((p) => p.price)).toLocaleString() + "đ"
                    : "Đang cập nhật"}
                </Text>
                </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            />
        ) : (
            <FlatList
            key={"menus"}
            data={menus}
            renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => nav.navigate("MenuDetails", { menuId: item.id })}
                >
                  <View style={styles.menuHeader}>
                    <Text style={styles.menuTitle}>{item.name}</Text>
                    <Text style={styles.menuCount}>{item.foods?.length || 0} </Text>
                  </View>
                </TouchableOpacity>
              )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            />
        )}
        </View>

    </View>
  );
};

  const styles = StyleSheet.create({
    foodCard: {
        width: "48%",
        backgroundColor: "#f9f9f9",
        borderRadius: 10,
        marginBottom: 15,
        overflow: "hidden",
        elevation: 2,
      },
      
      foodImage: {
        width: "100%",
        height: 100,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
      },
      
      foodName: {
        fontSize: 14,
        fontWeight: "bold",
        marginTop: 6,
        marginHorizontal: 8,
      },
      
      foodPrice: {
        fontSize: 13,
        color: "#e53935",
        fontWeight: "bold",
        marginBottom: 8,
        marginHorizontal: 8,
      },
      
      menuItem: {
        backgroundColor: "#f1f1f1",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
      },
      
      menuTitle: {
        fontSize: 16,
        fontWeight: "bold",
      },
      
      menuDesc: {
        fontSize: 13,
        color: "#666",
        marginTop: 4,
      },
      restaurantCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        padding: 10,
        borderRadius: 10,
        margin: 10,
        elevation: 2,
      },
      restaurantAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
      },
      restaurantName: {
        fontSize: 16,
        fontWeight: "bold",
      },
      ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
      },
      star: {
        color: "#2ecc71",
        marginRight: 4,
      },
      ratingText: {
        color: "#2ecc71",
        fontWeight: "bold",
      },
      actionsColumn: {
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "flex-end",
      },
      actionButton: {
        backgroundColor: "#eee",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 6,
      },
      actionButtonColor: {
        backgroundColor: "#9c27b0",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 6,
      },
      actionButtonText: {
        fontWeight: "bold",
        color: "#333",
      },
      actionButtonTextColor: {
        fontWeight: "bold",
        color: "white",
      },
      menuHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      
      
  });

export default RestaurantDetails;
