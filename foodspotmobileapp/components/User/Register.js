import { Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { Button, HelperText, TextInput } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const Register = () => {
    const info = [
        {
            label: 'Tên',
            icon: "text",
            secureTextEntry: false,
            field: "first_name"
        },
        {
            label: 'Họ và tên lót',
            icon: "text",
            secureTextEntry: false,
            field: "last_name"
        },
        {
            label: 'Tên đăng nhập',
            icon: "text",
            secureTextEntry: false,
            field: "username"
        },
        {
            label: 'Mật khẩu',
            icon: "eye",
            secureTextEntry: true,
            field: "password"
        },
        {
            label: 'Xác nhận mật khẩu',
            icon: "eye",
            secureTextEntry: true,
            field: "confirm"
        }
    ];
    const [user, setUser] = useState({
        username: "",
        email: "",
        password: "",
        confirm: "",
        first_name: "",
        last_name: "",
        phone_number: "",
        avatar: null
    });
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();

    const picker = async () => {
        let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Toast.show({
                type: "error",
                text1: "Lỗi",
                text2: "Quyền truy cập thư viện ảnh bị từ chối!"
            });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaType: "photo",
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1
        });

        if (!result.canceled) {
            setState(result.assets[0], "avatar");
            Toast.show({
                type: "success",
                text1: "Thành công",
                text2: "Đã chọn ảnh đại diện!"
            });
        }
    };

    const setState = (value, field) => {
        setUser({ ...user, [field]: value });
    };

    const validate = () => {
        if (!user.username || !user.password || !user.email || !user.first_name || !user.last_name) {
            setMsg("Vui lòng nhập đầy đủ tên đăng nhập, email, mật khẩu, họ và tên!");
            return false;
        } else if (user.password !== user.confirm) {
            setMsg("Mật khẩu không khớp!");
            return false;
        } else if (!/\S+@\S+\.\S+/.test(user.email)) {
            setMsg("Email không hợp lệ!");
            return false;
        }

        setMsg(null);
        return true;
    };

    const register = async () => {
        if (validate()) {
            try {
                setLoading(true);

                let form = new FormData();
                form.append("username", user.username);
                form.append("email", user.email);
                form.append("password", user.password);
                form.append("first_name", user.first_name);
                form.append("last_name", user.last_name);
                form.append("phone_number", user.phone_number || "");
                form.append("role", "CUSTOMER");

                if (user.avatar) {
                    form.append('avatar', {
                        uri: user.avatar.uri,
                        name: user.avatar.fileName || 'avatar.jpg',
                        type: user.avatar.type && user.avatar.type.startsWith('image/')
                        ? user.avatar.type
                        : 'image/jpeg'
                    });
                }

                let res = await Apis.post(endpoints['register_customer'], form, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                Toast.show({
                    type: "success",
                    text1: "Thành công",
                    text2: res.data.message || "Đăng ký thành công!"
                });
                nav.navigate("Login");
            } catch (ex) {
                const errorMessage = ex.response?.data?.error || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!";
                setMsg(errorMessage);
                Toast.show({
                    type: "error",
                    text1: "Lỗi",
                    text2: errorMessage
                });
                console.error("Lỗi đăng ký:", ex);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <SafeAreaView style={MyStyles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <Text style={{ fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 10 }}>
                        FoodSpot
                    </Text>
                    <Text style={{ textAlign: "center", marginBottom: 20 }}>
                        Tạo tài khoản để bắt đầu
                    </Text>

                    <HelperText type="error" visible={!!msg}>
                        {msg}
                    </HelperText>

                    {info.map(i => (
                        <TextInput
                            value={user[i.field]}
                            onChangeText={t => setState(t, i.field)}
                            style={MyStyles.margin}
                            key={i.field}
                            label={i.label}
                            secureTextEntry={i.secureTextEntry}
                            mode="outlined"
                            right={<TextInput.Icon icon={i.icon} />}
                        />
                    ))}
                    <TextInput
                        value={user.email}
                        onChangeText={t => setState(t, "email")}
                        style={MyStyles.margin}
                        label="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        mode="outlined"
                        right={<TextInput.Icon icon="email" />}
                    />
                    <TextInput
                        value={user.phone_number}
                        onChangeText={t => setState(t, "phone_number")}
                        style={MyStyles.margin}
                        label="Số điện thoại (tùy chọn)"
                        keyboardType="phone-pad"
                        mode="outlined"
                        right={<TextInput.Icon icon="phone" />}
                    />

                    <TouchableOpacity style={MyStyles.margin} onPress={picker} disabled={loading}>
                        <Text style={{ color: loading ? "#888" : "blue" }}>Chọn ảnh đại diện...</Text>
                    </TouchableOpacity>

                    {user.avatar && (
                        <Image
                            style={[MyStyles.avatar, MyStyles.margin, { width: 100, height: 100 }]}
                            source={{ uri: user.avatar.uri }}
                        />
                    )}

                    <Button
                        disabled={loading}
                        loading={loading}
                        onPress={register}
                        mode="contained"
                        style={MyStyles.margin}
                    >
                        Đăng ký
                    </Button>

                    <Text style={{ textAlign: "center", fontSize: 12, marginTop: 20, color: "#888" }}>
                        Bằng cách tiếp tục, bạn đồng ý với{" "}
                        <Text style={{ textDecorationLine: "underline" }}>Điều khoản</Text> và{" "}
                        <Text style={{ textDecorationLine: "underline" }}>Chính sách</Text> của chúng tôi.
                    </Text>

                    <Text style={{ textAlign: "center", marginTop: 10 }}>
                        Bạn là chủ nhà hàng?{" "}
                        <Text
                            style={{ color: "blue", textDecorationLine: "underline" }}
                            onPress={() => nav.navigate("RestaurantRegister")}
                        >
                            Đăng ký tại đây
                        </Text>
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Register;