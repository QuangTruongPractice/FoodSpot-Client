import { ScrollView, View, Text, TouchableOpacity, Image } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import * as ImagePicker from 'expo-image-picker';

const Register = () => {
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigation();

  const setState = (value, field) => setUser({ ...user, [field]: value });

  const validate = () => {
    if (!user.username || !user.email || !user.password || !user.first_name || !user.last_name) {
      setMsg("Vui lòng nhập đầy đủ tên đăng nhập, email, mật khẩu, họ và tên!");
      return false;
    }
    setMsg(null);
    return true;
  };

  const register = async () => {
    if (validate()) {
      try {
        setLoading(true);
        const registerData = {
          ...user,
          phone_number: user.phone_number || null,
          role: "CUSTOMER",
        };
        let res = await Apis.post(endpoints["register"], registerData);
        nav.navigate("Login");
      } catch (ex) {
        setMsg(
          ex.response?.data?.error || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const pick = async () => {
    let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
        alert("Permissions denied!");
    } else {
        const result = await ImagePicker.launchImageLibraryAsync();

        if (!result.canceled) {
            setState(result.assets[0], "avatar");
        }
    }
  }

  const fields = [
    { label: "Tên đăng nhập", icon: "account", secureTextEntry: false, field: "username" },
    { label: "Email", icon: "email", secureTextEntry: false, field: "email" },
    { label: "Mật khẩu", icon: "lock", secureTextEntry: true, field: "password" },
    { label: "Họ", icon: "account", secureTextEntry: false, field: "first_name" },
    { label: "Tên", icon: "account", secureTextEntry: false, field: "last_name" },
    { label: "Số điện thoại (tuỳ chọn)", icon: "phone", secureTextEntry: false, field: "phone_number" },
  ];

  return (
    <View style={[MyStyles.container, { justifyContent: "center" }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 10 }}>
          FoodSpot
        </Text>
        <Text style={{ textAlign: "center", marginBottom: 20 }}>
          Create an account to get started
        </Text>

        <HelperText type="error" visible={!!msg}>
          {msg}
        </HelperText>

        {fields.map((i) => (
          <TextInput
            key={i.field}
            value={user[i.field]}
            onChangeText={(t) => setState(t, i.field)}
            label={i.label}
            secureTextEntry={i.secureTextEntry}
            mode="outlined"
            style={MyStyles.margin}
            right={<TextInput.Icon icon={i.icon} />}
          />
        ))}
        <TouchableOpacity style={MyStyles.m} onPress={pick}>
            <Text>Chọn ảnh đại diện...</Text>
        </TouchableOpacity>
        {user.avatar && <Image source={{uri: user.avatar.uri}} style={MyStyles.avatar} />}

        <Button
          mode="contained"
          onPress={register}
          loading={loading}
          disabled={loading}
          style={MyStyles.margin}
        >
          Đăng ký
        </Button>

        <Text style={{ textAlign: "center", fontSize: 12, marginTop: 20, color: "#888" }}>
          Bằng cách tiếp tục, bạn đồng ý với{" "}
          <Text style={{ textDecorationLine: "underline" }}>Điều khoản</Text> và{" "}
          <Text style={{ textDecorationLine: "underline" }}>Chính sách</Text> của chúng tôi.
        </Text>
      </ScrollView>
    </View>
  );
};

export default Register;
