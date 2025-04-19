import { ScrollView, View } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext } from "../../configs/MyContexts";

const Login = () => {
  const info = [
    { label: "Tên đăng nhập", icon: "text", secureTextEntry: false, field: "username" },
    { label: "Mật khẩu", icon: "eye", secureTextEntry: true, field: "password" },
  ];
  const [user, setUser] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigation();
  const dispatch = useContext(MyDispatchContext);

  const setState = (value, field) => {
    setUser({ ...user, [field]: value });
  };

  const validate = () => {
    if (!user.username || !user.password) {
      setMsg("Vui lòng nhập tên đăng nhập và mật khẩu!");
      return false;
    }
    setMsg(null);
    return true;
  };

  const login = async () => {
    if (validate()) {
      try {
        setLoading(true);
        const loginData = {
          username: user.username,
          password: user.password,
          client_id: "ly6xF1VvDFftDXCFUZtr3ZNNzLqcTUzv1uz7wmVO",
          client_secret:
            "tVdL3xRmmzbdc1DrI4IP4SqxQAjo1uAa7BJ64l00jB5R3wZg06VPyNNwrYMHlblZFAiCnakzFQc8Pbwdov5n7g5lhuoFxbPLkMDlSmS94CM5mpbbTYzCJsYhRK7RkBMV",
          grant_type: "password",
        };
        console.log("Dữ liệu gửi tới /o/token/:", loginData);

        let res = await Apis.post(endpoints["login"], loginData);
        const accessToken = res.data.access_token;
        console.log("Access Token:", accessToken);

        await AsyncStorage.setItem("token", accessToken);
        console.log("Token đã lưu vào AsyncStorage:", accessToken);

        // Gọi API /users/current-user/
        let userRes = await authApis(accessToken).get(endpoints["users_current-user_read"]);
        console.log("Thông tin người dùng:", userRes.data);

        // Cập nhật MyUserContext
        dispatch({
          type: "login",
          payload: userRes.data, // Lưu thông tin user
        });

        nav.navigate("index");
      } catch (ex) {
        console.error("Lỗi đăng nhập:", ex.response?.data || ex.message);
        setMsg(
          ex.response?.data?.detail ||
            "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={MyStyles.container}>
      <ScrollView>
        <HelperText type="error" visible={!!msg}>
          {msg}
        </HelperText>

        {info.map((i) => (
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
          onPress={login}
          mode="contained"
          style={MyStyles.margin}
        >
          Đăng nhập
        </Button>
      </ScrollView>
    </View>
  );
};

export default Login;