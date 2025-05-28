import { Text, View, Image, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { useContext, useState } from "react";
import { MyDispatchContext, MyUserContext } from "../../configs/MyContexts";
import { Button, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Icon } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { authApis, endpoints } from '../../configs/Apis';
import { checkToken, loadUser } from "../../configs/Data";

const Profile = () => {
  const user = useContext(MyUserContext);
  const dispatch = useContext(MyDispatchContext);

  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [avatar, setAvatar] = useState(user[0]?.avatar || "");
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("access_token");
      console.log("Token đã được xóa khỏi AsyncStorage");
      dispatch({ type: "logout" });
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatar(result.assets[0].uri);
      console.log("Ảnh mới đã chọn:", result.assets[0].uri);
      handleEdit("avatar", result.assets[0].uri);
    }
  };

  if (!user || !user[0]) {
    return (
      <View style={[MyStyles.container, MyStyles.center]}>
        <Text style={[MyStyles.subject, { color: "#666", fontSize: 18 }]}>
          Bạn đã đăng xuất
        </Text>
      </View>
    );
  }

  const userData = user[0];

  const handleEdit = async (field, editedData) => {
    setLoading(true);
    try {
      const token = await checkToken();
      const data = {};
      data[field] = editedData;

      await authApis(token).patch(endpoints["current-user"], data);
      let userRes = await loadUser(token);

      dispatch({ type: "login", payload: userRes });
    } catch (err) {
      console.error("Lỗi cập nhật dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[MyStyles.container, { padding: 20 }]}>
      {loading ? (
        <View style={[MyStyles.container, MyStyles.center]}>
          <ActivityIndicator size="large" color="#e53935" />
          <Text>Đang cập nhật thông tin...</Text>
        </View>
      ) : (
        <Card style={{ padding: 20, borderRadius: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <TouchableOpacity onPress={pickImage}>
              <Image
                source={{ uri: avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  marginBottom: 10,
                  backgroundColor: "#ccc",
                }}
              />
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: "bold" }}>
              {userData.first_name || "Không có"} {userData.last_name || "Tên"}
            </Text>
            <Text style={{ fontSize: 16, color: "#666" }}>
              {userData.role || "Người dùng"}
            </Text>
          </View>

          {/* Email */}
          <View style={{ marginVertical: 10 }}>
            <Text style={styles.label}>Email</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {editingEmail ? (
                <TextInput
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="Nhập email mới"
                  style={{ flex: 1, fontSize: 16, borderBottomWidth: 1 }}
                />
              ) : (
                <Text style={[styles.info, { flex: 1 }]}>
                  {userData.email || "Không có email"}
                </Text>
              )}
              <TouchableOpacity onPress={() => {
                if (editingEmail) {
                  console.log("Email mới:", newEmail);
                  handleEdit("email", newEmail);
                }
                setEditingEmail(!editingEmail);
                setNewEmail(userData.email);
              }}>
                <Icon source="pencil" size={22} color="#e53935" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Số điện thoại */}
          <View style={{ marginVertical: 10 }}>
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {editingPhone ? (
                <TextInput
                  value={newPhone}
                  onChangeText={setNewPhone}
                  placeholder="Nhập số điện thoại mới"
                  style={{ flex: 1, fontSize: 16, borderBottomWidth: 1 }}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={[styles.info, { flex: 1 }]}>
                  {userData.phone_number || "Chưa cung cấp"}
                </Text>
              )}
              <TouchableOpacity onPress={() => {
                if (editingPhone) {
                  console.log("Số ĐT mới:", newPhone);
                  handleEdit("phone_number", newPhone);
                }
                setEditingPhone(!editingPhone);
                setNewPhone(userData.phone_number);
              }}>
                <Icon source="pencil" size={22} color="#e53935" />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            mode="contained"
            buttonColor="#ff4d4f"
            textColor="white"
            style={{ marginTop: 20 }}
            onPress={logout}
          >
            Đăng xuất
          </Button>
        </Card>
      )}
    </View>
  );
};

const styles = {
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 4,
  },
  info: {
    fontSize: 16,
    color: "#000",
  },
};

export default Profile;
