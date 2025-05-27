import { Text, View, Image, ScrollView, TextInput, TouchableOpacity, Alert, Modal } from "react-native";
import { useState, useCallback } from "react";
import { authApis, endpoints } from '../../configs/Apis';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator } from "react-native";
import { Icon, Button } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { checkToken, loadOrderDetails, loadUser, loadUserReviewFood } from "../../configs/Data";
import styles from "../../styles/OrderDetailsStyles";

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

    const loadData = async () => {
        try {
            const token = await checkToken();
            const res = await loadOrderDetails(token, orderDetailId)
            setOrderDetail(res);
            const userRes = await loadUser(token);
            setCurrentUser(userRes);
            const allReviews = await loadUserReviewFood(token);
            const filteredReviews = allReviews.filter(r => r.order_detail == orderDetailId);
            setReviews(filteredReviews);
        } catch (err) {
            console.error("Error loading order detail:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async () => {
      const token = await checkToken();
      const allReviews = await loadUserReviewFood(token);
      const filteredReviews = allReviews.filter(r => r.order_detail == orderDetailId);
      setReviews(filteredReviews);
    }

    const handleSubmit = async () => {
        if (!comment || star === 0) {
          alert("Vui lòng nhập đánh giá và chọn số sao.");
          return;
        }
        const token = await checkToken();
        const id = await AsyncStorage.getItem("userId");
        const res = await authApis(token).post(endpoints["reviews-food"], {
          comment: comment,
          star: star,
          order_detail: orderDetailId,
          user: parseInt(id)
        });
        // Thêm đánh giá mới vào đầu danh sách
        setReviews([res.data, ...reviews]);
        setComment("");
        setStar(0);
      };

    const handleDelete = async (reviewId) => {
        const token = await checkToken();
        await authApis(token).delete(endpoints["reviews-food-detail"](reviewId));
        console.log("Đang xóa đánh giá", reviewId);
        await loadReviews();
    };
      
    const handleEdit = async (reviewId, editedComment) => {
        const token = await checkToken();
        await authApis(token).patch(endpoints["reviews-food-detail"](reviewId), {
          comment: editedComment
        });
        console.log("Cập nhật đánh giá", reviewId, editedComment);
        setModalVisible(false);
        await loadReviews();
    };

    useFocusEffect(
        useCallback(() => {
          loadData();
          loadReviews();
        }, [])
      );

    if (loading)
        return <ActivityIndicator size="large" color="#0000ff" />;

    const food = orderDetail.food;

    return (
        <ScrollView style={{ padding: 10 }}>
            <View style={styles.foodCard}>
            <Image source={{ uri: food.image }} style={styles.foodImage} />
            <Text style={styles.foodName}>{food.name}</Text>
            <Text style={styles.foodText}>Nhà hàng: {food.restaurant_name}</Text>
            <Text style={styles.foodText}>Giá: {food.prices[0].price.toLocaleString()}đ</Text>
            <Text style={styles.foodText}>Phục vụ: {orderDetail.time_serve}</Text>
            <Text style={styles.foodText}>Số lượng: {orderDetail.quantity}</Text>
            <Text style={styles.foodText}>Tạm tính: {orderDetail.sub_total.toLocaleString()}đ</Text>
            <Text style={styles.foodText}>Mô tả: {food.description}</Text>
            </View>

            <View style={styles.container}>
              <Image
                source={{
                  uri: currentUser.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                }}
                style={styles.reviewsAvatar}
              />

              <View style={styles.middleContent}>
                <Text style={styles.username}>{currentUser.username}</Text>

                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TouchableOpacity key={i} onPress={() => setStar(i)}>
                      <Text style={[styles.star, { color: i <= star ? "#FFD700" : "#CCC" }]}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.commentRow}>
                  <TextInput
                    placeholder="Nhận xét..."
                    value={comment}
                    onChangeText={setComment}
                    style={styles.textInput}
                    multiline
                  />
                  <TouchableOpacity onPress={() => handleSubmit()} style={styles.sendButton}>
                    <Icon source="send" size={22} color="#e53935" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {reviews.length === 0 ? (
                <Text style={{ textAlign: "center", marginTop: 20 }}>
                  Chưa có đánh giá nào
                </Text>
              ) : (
                reviews.map((item) => (
                  <View key={item.id} style={styles.reviewWrapper}>
                    {/* Phần review chính */}
                    <View style={styles.reviewMain}>
                      <Image
                        source={{
                          uri: item.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                        }}
                        style={styles.reviewsAvatar}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "bold" }}>{item.user_name}</Text>
                        <Text>{item.comment}</Text>
                        <Text style={styles.star}>⭐ {item.star} / 5</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert("Tùy chọn", null, [
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
                        <Icon source="dots-vertical" size={20} color="gray" />
                      </TouchableOpacity>
                    </View>

                    {/* Phần reply (hiển thị bên dưới review chính) */}
                    {item.replies.length > 0 && (
                      <View
                        style={{
                          marginTop: 8,
                          paddingLeft: 20,
                          borderLeftWidth: 2,
                          borderLeftColor: "#ccc",
                        }}
                      >
                        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Phản hồi:</Text>
                        {item.replies.map((reply, index) => (
                          <View key={index} style={styles.replyItem}>
                            <Image
                              source={{
                                uri: reply.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                              }}
                              style={styles.replyAvatar}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontWeight: "600" }}>{reply.user_name}</Text>
                              <Text>{reply.comment}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
            <Modal visible={modalVisible} animationType="slide" transparent>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chỉnh sửa đánh giá</Text>
                <TextInput
                  style={styles.input}
                  value={editedComment}
                  onChangeText={setEditedComment}
                  placeholder="Nhập bình luận mới"
                  multiline
                />
                <View style={styles.modalButtons}>
                  <Button
                    mode="contained"
                    onPress={() => {
                      handleEdit(editingReview.id, editedComment);
                      setModalVisible(false);
                    }}
                  > Lưu
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => setModalVisible(false)}
                    style={{ marginLeft: 10 }}
                  > Hủy
                  </Button>
                </View>
              </View>
            </View>
          </Modal>

        </ScrollView>
    );
};

export default OrderDetails;
