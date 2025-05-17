import React, { useEffect, useState, useContext } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import { Card, Title, Paragraph, Button, TextInput, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { MyUserContext } from "../../configs/MyContexts";

const ManageMenus = () => {
  const [menus, setMenus] = useState([]);
  const [newMenu, setNewMenu] = useState({
    name: "",
    description: "",
    time_serve: "MORNING",
    foods: "",
  });
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId } = route.params;
  const [user] = useContext(MyUserContext);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token || !user || user.role !== "RESTAURANT_USER") {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại!");
        navigation.navigate("Auth", { screen: "Login" });
        return;
      }

      const authApi = authApis(token);
      const response = await authApi.get(endpoints["restaurant-menus"](restaurantId));
      setMenus(response.data);
    } catch (ex) {
      let errorMessage = ex.message || "Không thể tải menu!";
      if (ex.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn!";
        await AsyncStorage.removeItem("access_token");
        navigation.navigate("Auth", { screen: "Login" });
      }
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleInputChange = (field, value) => {
    setNewMenu({ ...newMenu, [field]: value });
  };

  const createMenu = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại!");
        navigation.navigate("Auth", { screen: "Login" });
        return;
      }

      const authApi = authApis(token);
      const foodIds = newMenu.foods.split(",").map((id) => parseInt(id.trim())).filter((id) => id);
      await authApi.post(endpoints.menus, {
        restaurant: restaurantId,
        name: newMenu.name,
        description: newMenu.description,
        time_serve: newMenu.time_serve,
        foods: foodIds,
      });
      Alert.alert("Thành công", "Menu đã được tạo!");
      setNewMenu({ name: "", description: "", time_serve: "MORNING", foods: "" });
      fetchMenus();
    } catch (ex) {
      let errorMessage = ex.message || "Không thể tạo menu!";
      if (ex.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn!";
        await AsyncStorage.removeItem("access_token");
        navigation.navigate("Auth", { screen: "Login" });
      }
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteMenu = async (menuId) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      const authApi = authApis(token);
      await authApi.delete(endpoints["menus-details"](menuId));
      Alert.alert("Thành công", "Menu đã được xóa!");
      fetchMenus();
    } catch (ex) {
      let errorMessage = ex.message || "Không thể xóa menu!";
      if (ex.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn!";
        await AsyncStorage.removeItem("access_token");
        navigation.navigate("Auth", { screen: "Login" });
      }
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderMenu = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.name}</Title>
        <Paragraph>{item.description}</Paragraph>
        <Paragraph>Buổi: {item.time_serve}</Paragraph>
        <Paragraph>Món ăn: {item.foods.map((f) => f.name).join(", ")}</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => deleteMenu(item.id)}>Xóa</Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={MyStyles.container}>
        <ActivityIndicator animating={true} size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <View style={MyStyles.container}>
      <Title style={styles.title}>Quản lý Menu</Title>
      <TextInput
        label="Tên menu"
        value={newMenu.name}
        onChangeText={(text) => handleInputChange("name", text)}
        style={MyStyles.margin}
      />
      <TextInput
        label="Mô tả"
        value={newMenu.description}
        onChangeText={(text) => handleInputChange("description", text)}
        style={MyStyles.margin}
        multiline
      />
      <TextInput
        label="Buổi phục vụ (MORNING/NOON/EVENING)"
        value={newMenu.time_serve}
        onChangeText={(text) => handleInputChange("time_serve", text)}
        style={MyStyles.margin}
      />
      <TextInput
        label="ID món ăn (phân cách bởi dấu phẩy)"
        value={newMenu.foods}
        onChangeText={(text) => handleInputChange("foods", text)}
        style={MyStyles.margin}
      />
      <Button
        mode="contained"
        onPress={createMenu}
        disabled={loading}
        style={[MyStyles.margin, styles.button]}
      >
        {loading ? <ActivityIndicator color="#fff" /> : "Thêm menu"}
      </Button>
      <FlatList
        data={menus}
        renderItem={renderMenu}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
  },
  card: {
    marginVertical: 10,
    marginHorizontal: 15,
    elevation: 3,
  },
  list: {
    paddingBottom: 20,
  },
  button: {
    marginTop: 20,
  },
});

export default ManageMenus;