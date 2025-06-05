import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from "./Apis";
import { checkToken, getCurrentTimeServe } from "./Data";

export const toggleFavorite = async ({ nav, foodId, favStatus, setFavStatus }) => {
  const token = await checkToken(nav);
  if (!token) {
    return;
  }
  try {
    const newStatus = favStatus === "FAVORITE" ? "CANCEL" : "FAVORITE";

    await authApis(token).post(endpoints["current-user-favorite"], {
      food: foodId,
      status: newStatus,
    });

    setFavStatus(newStatus);
  } catch (error) {
    console.error("Lỗi cập nhật yêu thích:", error);
    Alert.alert("Lỗi", "Không thể cập nhật trạng thái yêu thích.");
  }
};

// Hàm thêm vào giỏ hàng
export const addFoodToCart = async ({ nav, foodId }) => {
  const token = await checkToken(nav);
  if (!token) {
    return;
  }
  try {  
    const currentTimeServe = getCurrentTimeServe();

    await authApis(token).post(endpoints["add-to-cart"], {
      food_id: foodId,
      time_serve: currentTimeServe,
    });

    Toast.show({
      type: "success",
      text1: "Thành công",
      text2: "Đã thêm vào giỏ hàng!",
      position: "top",
      visibilityTime: 2000,
    });
  } catch (error) {
    console.error("Thêm vào giỏ lỗi:", error);
    Toast.show({
      type: "error",
      text1: "Lỗi",
      text2: "Không thể thêm vào giỏ hàng!",
      position: "top",
    });
  }
};

export const handleSubmitReview = async ({ type, id, token, comment, star, setReviews, reviews, setComment, setStar }) => {
  if (!comment || star === 0) {
    alert("Vui lòng nhập đánh giá và chọn số sao.");
    return;
  }
  const user = parseInt(await AsyncStorage.getItem("userId"));

  const payload = {
    comment,
    star,
    user,
    [type === "restaurant" ? "restaurant" : "order_detail"]: id,
  };

  const endpoint = endpoints[
    type === "restaurant" ? "reviews-restaurant" : "reviews-food"
  ];

  const res = await authApis(token).post(endpoint, payload);
  setReviews([res.data, ...(reviews || [])]);
  setComment("");
  setStar(0);
};