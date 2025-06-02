import { ActivityIndicator, Image, Text, TouchableOpacity, View, ScrollView, SafeAreaView } from "react-native";
import { useState, useCallback } from "react";
import { TextInput, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { authApis, endpoints } from '../../configs/Apis';
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import { checkToken, loadOrderDetails, loadUser, loadUserReviewFood } from "../../configs/Data";
import { Modal } from "react-native";

const OrderDetails = ({ route }) => {
    const { orderDetailId } = route.params;
    const [orderDetail, setOrderDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [star, setStar] = useState(0);
    const [reviews, setReviews] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [editedComment, setEditedComment] = useState("");
    const nav = useNavigation();

    const loadData = async () => {
        try {
            const token = await checkToken(nav);
            const res = await loadOrderDetails(token, orderDetailId);
            setOrderDetail(res);
            const userRes = await loadUser(token);
            setCurrentUser(userRes);
            await loadReviews(token);
        } catch (err) {
            console.error("Lỗi khi tải chi tiết đơn hàng:", err);
            alert("Đã có lỗi xảy ra khi tải dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async (token) => {
        try {
            const allReviews = await loadUserReviewFood(token);
            const filteredReviews = allReviews.filter(r => r.order_detail === orderDetailId);
            setReviews(filteredReviews);
        } catch (err) {
            console.error("Lỗi khi tải đánh giá:", err);
        }
    };

    const handleSubmit = async () => {
        if (!comment || star === 0) {
            alert("Vui lòng nhập nhận xét và chọn số sao.");
            return;
        }
        try {
            const token = await checkToken(nav);
            const id = await AsyncStorage.getItem("userId");
            const res = await authApis(token).post(endpoints["reviews-food"], {
                comment: comment,
                star: star,
                order_detail: orderDetailId,
                user: parseInt(id)
            });
            setReviews([res.data, ...reviews]);
            setComment("");
            setStar(0);
            alert("Đã gửi đánh giá thành công!");
        } catch (err) {
            console.error("Lỗi khi gửi đánh giá:", err);
            alert("Gửi đánh giá thất bại. Vui lòng thử lại.");
        }
    };

    const handleDelete = async (reviewId) => {
        try {
            const token = await checkToken(nav);
            await authApis(token).delete(endpoints["reviews-food-detail"](reviewId));
            await loadReviews(token);
            alert("Xóa đánh giá thành công!");
        } catch (err) {
            console.error("Lỗi khi xóa đánh giá:", err);
            alert("Xóa đánh giá thất bại. Vui lòng thử lại.");
        }
    };

    const handleEdit = async (reviewId, editedComment) => {
        try {
            const token = await checkToken(nav);
            await authApis(token).patch(endpoints["reviews-food-detail"](reviewId), {
                comment: editedComment
            });
            setModalVisible(false);
            await loadReviews(token);
            alert("Cập nhật đánh giá thành công!");
        } catch (err) {
            console.error("Lỗi khi cập nhật đánh giá:", err);
            alert("Cập nhật đánh giá thất bại. Vui lòng thử lại.");
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [orderDetailId])
    );

    if (loading) {
        return (
            <SafeAreaView style={[MyStyles.container, MyStyles.p]}>
                <ActivityIndicator size="large" color="#0000ff" />
            </SafeAreaView>
        );
    }

    const food = orderDetail.food;

    return (
        <SafeAreaView style={[MyStyles.container, MyStyles.p]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header with Navigation Options */}
                <View style={[MyStyles.row, { justifyContent: "space-around", marginBottom: 10 }]}>
                    <TouchableOpacity style={MyStyles.optionButton} onPress={() => nav.goBack()}>
                        <Icon name="arrow-left" size={20} />
                        <Text style={MyStyles.optionText}>Quay lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={MyStyles.optionButton} onPress={() => nav.navigate("Cart")}>
                        <Icon name="cart-outline" size={20} />
                        <Text style={MyStyles.optionText}>Giỏ hàng</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={MyStyles.optionButton} onPress={() => nav.navigate("Order")}>
                        <Icon name="cart-outline" size={20} />
                        <Text style={MyStyles.optionText}>Đơn hàng</Text>
                    </TouchableOpacity>
                </View>

                {/* Food Details */}
                <View style={MyStyles.productCardGrid}>
                    <Image
                        source={{ uri: food.image || "https://picsum.photos/400/200" }}
                        style={MyStyles.productImage}
                        resizeMode="cover"
                    />
                    <Text style={MyStyles.productName}>{food.name}</Text>
                    <Text style={MyStyles.productBrand}>Nhà hàng: {food.restaurant_name}</Text>
                    <Text style={MyStyles.productPrice}>{food.prices[0].price.toLocaleString("vi-VN")}₫</Text>
                    <Text style={MyStyles.productText}>Phục vụ: {orderDetail.time_serve}</Text>
                    <Text style={MyStyles.productText}>Số lượng: {orderDetail.quantity}</Text>
                    <Text style={MyStyles.productText}>Tạm tính: {orderDetail.sub_total.toLocaleString("vi-VN")}₫</Text>
                    <Text style={MyStyles.productText}>Mô tả: {food.description}</Text>
                </View>

                {/* Review Input Section */}
                <View style={[MyStyles.row, { marginTop: 20, alignItems: "center" }]}>
                    <Image
                        source={{
                            uri: currentUser.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                        }}
                        style={[MyStyles.reviewsAvatar, { width: 50, height: 50, borderRadius: 25 }]}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={MyStyles.productName}>{currentUser.username}</Text>
                        <View style={[MyStyles.row, { marginVertical: 5 }]}>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <TouchableOpacity key={i} onPress={() => setStar(i)}>
                                    <Text style={{ fontSize: 20, color: i <= star ? "#FFD700" : "#CCC" }}>★</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={[MyStyles.row, { alignItems: "center" }]}>
                            <TextInput
                                placeholder="Nhận xét..."
                                value={comment}
                                onChangeText={setComment}
                                style={[MyStyles.textInput, { flex: 1 }]}
                                multiline
                            />
                            <TouchableOpacity onPress={handleSubmit} style={{ marginLeft: 10 }}>
                                <Icon name="send" size={22} color="#e53935" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Reviews List */}
                <View style={{ marginTop: 20 }}>
                    {reviews.length === 0 ? (
                        <Text style={MyStyles.productEmpty}>Chưa có đánh giá nào</Text>
                    ) : (
                        reviews.map((item) => (
                            <View key={item.id} style={[MyStyles.productCardGrid, { marginBottom: 10 }]}>
                                <View style={[MyStyles.row, { alignItems: "center" }]}>
                                    <Image
                                        source={{
                                            uri: item.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                                        }}
                                        style={[MyStyles.reviewsAvatar, { width: 40, height: 40, borderRadius: 20 }]}
                                    />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={MyStyles.productName}>{item.user_name}</Text>
                                        <Text style={MyStyles.productText}>{item.comment}</Text>
                                        <Text style={MyStyles.productText}>⭐ {item.star} / 5</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() =>
                                            alert("Tùy chọn", null, [
                                                {
                                                    text: "Chỉnh sửa",
                                                    onPress: () => {
                                                        setEditingReview(item);
                                                        setEditedComment(item.comment);
                                                        setModalVisible(true);
                                                    },
                                                },
                                                {
                                                    text: "Xóa",
                                                    style: "destructive",
                                                    onPress: () => handleDelete(item.id),
                                                },
                                                { text: "Hủy", style: "cancel" },
                                            ])
                                        }
                                    >
                                        <Icon name="dots-vertical" size={20} color="gray" />
                                    </TouchableOpacity>
                                </View>
                                {item.replies.length > 0 && (
                                    <View style={{ marginTop: 8, paddingLeft: 20, borderLeftWidth: 2, borderLeftColor: "#ccc" }}>
                                        <Text style={[MyStyles.productName, { marginBottom: 5 }]}>Phản hồi:</Text>
                                        {item.replies.map((reply, index) => (
                                            <View key={index} style={[MyStyles.row, { marginBottom: 5 }]}>
                                                <Image
                                                    source={{
                                                        uri: reply.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                                                    }}
                                                    style={[MyStyles.reviewsAvatar, { width: 30, height: 30, borderRadius: 15 }]}
                                                />
                                                <View style={{ flex: 1, marginLeft: 10 }}>
                                                    <Text style={MyStyles.productName}>{reply.user_name}</Text>
                                                    <Text style={MyStyles.productText}>{reply.comment}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Edit Review Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.5)",
                }}>
                    <View style={[MyStyles.productCardGrid, { backgroundColor: "#fff", padding: 20, borderRadius: 10 }]}>
                        <Text style={MyStyles.productName}>Chỉnh sửa đánh giá</Text>
                        <TextInput
                            style={[MyStyles.textInput, { marginVertical: 10 }]}
                            value={editedComment}
                            onChangeText={setEditedComment}
                            placeholder="Nhập bình luận mới"
                            multiline
                        />
                        <View style={[MyStyles.row, { justifyContent: "flex-end" }]}>
                            <Button
                                mode="contained"
                                onPress={() => handleEdit(editingReview.id, editedComment)}
                            >Lưu</Button>
                            <Button
                                mode="text"
                                onPress={() => setModalVisible(false)}
                                style={{ marginLeft: 10 }}
                            >Hủy</Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default OrderDetails;