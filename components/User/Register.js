import { ScrollView, View } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";

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

  const setState = (value, field) => {
    setUser({ ...user, [field]: value });
  };

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
          username: user.username,
          email: user.email,
          password: user.password,
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: user.phone_number || null,
          role: "CUSTOMER",
        };
        console.log("Dữ liệu gửi tới /users/register/:", registerData);

        let res = await Apis.post(endpoints["register"], registerData);
        console.log("Phản hồi đăng ký:", res.status, res.data); // Thêm log mã trạng thái

        nav.navigate("Login");
      } catch (ex) {
        console.error("Lỗi đăng ký:", ex.response?.status, ex.response?.data || ex.message);
        setMsg(
          ex.response?.data?.error ||
            "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const fields = [
    { label: "Tên đăng nhập", icon: "account", secureTextEntry: false, field: "username" },
    { label: "Email", icon: "email", secureTextEntry: false, field: "email" },
    { label: "Mật khẩu", icon: "lock", secureTextEntry: true, field: "password" },
    { label: "Họ", icon: "account", secureTextEntry: false, field: "first_name" },
    { label: "Tên", icon: "account", secureTextEntry: false, field: "last_name" },
    { label: "Số điện thoại", icon: "phone", secureTextEntry: false, field: "phone_number" },
  ];

  return (
    <View style={MyStyles.container}>
      <ScrollView>
        <HelperText type="error" visible={!!msg}>
          {msg}
        </HelperText>

        {fields.map((i) => (
          <TextInput
            value={user[i.field]}
            onChangeText={(t) => setState(t, i.field)}
            style={MyStyles.margin}
            key={i.field}
            label={i.label}
            secureTextEntry={i.secureTextEntry}
            right={<TextInput.Icon icon={i.icon} />}
          />
        ))}

        <Button
          disabled={loading}
          loading={loading}
          onPress={register}
          mode="contained"
          style={MyStyles.margin}
        >
          Đăng ký
        </Button>
      </ScrollView>
    </View>
  );
};

export default Register;