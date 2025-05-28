import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { MyUserContext } from "../../configs/MyContexts";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

const ToggleAvailability = ({ navigation, route }) => {
  const [user] = useContext(MyUserContext);
  const { foodId, currentStatus } = route.params;

  const handleToggle = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const authApi = authApis(token);
      const response = await authApi.patch(endpoints["food-details"](foodId), {
        is_available: !currentStatus,
      });
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Món ăn đã được ${response.data.is_available ? "kích hoạt" : "tạm ẩn"}!`,
      });
      navigation.goBack();
    } catch (ex) {
      let errorMessage = ex.message || "Không thể cập nhật trạng thái!";
      if (ex.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn!";
        await AsyncStorage.removeItem("access_token");
        navigation.navigate("Auth", { screen: "Login" });
      } else if (ex.response?.status === 403) {
        errorMessage = "Bạn không có quyền cập nhật món ăn này!";
      }
      console.error("Lỗi cập nhật trạng thái:", ex.response?.data || ex.message);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: errorMessage,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chuyển đổi Trạng thái</Text>
      <Text style={styles.info}>
        Món ăn hiện đang {currentStatus ? "có sẵn" : "tạm ẩn"}. Bạn có muốn {currentStatus ? "tạm ẩn" : "kích hoạt"} món ăn này?
      </Text>
      <Button
        mode="contained"
        onPress={handleToggle}
        style={[styles.button, { backgroundColor: currentStatus ? "#d32f2f" : "#2e7d32" }]}
        labelStyle={styles.buttonLabel}
      >
        {currentStatus ? "Tạm ẩn món ăn" : "Kích hoạt món ăn"}
      </Button>
      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={[styles.button, { borderColor: "#6200ee" }]}
        labelStyle={[styles.buttonLabel, { color: "#6200ee" }]}
      >
        Hủy
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  info: {
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    marginVertical: 8,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ToggleAvailability;