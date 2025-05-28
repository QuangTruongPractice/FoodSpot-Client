import React, { useContext } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Button } from "react-native-paper";
import { MyUserContext } from "../../configs/MyContexts";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

const DeleteFood = ({ navigation, route }) => {
  const [user] = useContext(MyUserContext);
  const { foodId } = route.params;

  const handleDelete = async () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa món ăn này? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("access_token");
              const authApi = authApis(token);
              await authApi.delete(endpoints["food-details"](foodId));
              Toast.show({
                type: "success",
                text1: "Thành công",
                text2: "Món ăn đã được xóa!",
              });
              navigation.goBack();
            } catch (ex) {
              let errorMessage = ex.message || "Không thể xóa món ăn!";
              if (ex.response?.status === 401) {
                errorMessage = "Phiên đăng nhập hết hạn!";
                await AsyncStorage.removeItem("access_token");
                navigation.navigate("Auth", { screen: "Login" });
              } else if (ex.response?.status === 403) {
                errorMessage = "Bạn không có quyền xóa món ăn này!";
              }
              console.error("Lỗi xóa món ăn:", ex.response?.data || ex.message);
              Toast.show({
                type: "error",
                text1: "Lỗi",
                text2: errorMessage,
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xóa Món Ăn</Text>
      <Text style={styles.warning}>
        Bạn có chắc chắn muốn xóa món ăn này? Hành động này không thể hoàn tác.
      </Text>
      <Button
        mode="contained"
        onPress={handleDelete}
        style={[styles.button, { backgroundColor: "#d32f2f" }]}
        labelStyle={styles.buttonLabel}
      >
        Xóa món ăn
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
  warning: {
    fontSize: 16,
    color: "#d32f2f",
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

export default DeleteFood;