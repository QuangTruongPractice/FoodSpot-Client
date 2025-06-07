import AsyncStorage from '@react-native-async-storage/async-storage';
import Apis, { authApis, endpoints } from './Apis';

export const checkToken = async (nav) => {
  const token = await AsyncStorage.getItem('access_token');
  if (!token) {
    nav.replace('Login');
    return null; 
  }
  return token;
};

export function getCurrentTimeServe() {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 5 && hour < 11) {
    return 'MORNING';
  } else if (hour >= 11 && hour < 13) {
    return 'EVENING';
  } else if (hour >= 13 && hour < 23) {
    return 'EVENING';
  } else if (hour >= 23 || hour < 5) {
    return 'EVENING';
  } else {
    return null;
  }
}

export const formatCurrency = (num) => {
  return `${num.toLocaleString('vi-VN')}đ`;
};

export const loadUser = async (token) => {
  const user = await authApis(token).get(endpoints["current-user"]);
  return user.data;
}

export const loadUserDetails = async (token, userId) => {
  const user = await authApis(token).get(endpoints["users_read"](userId));
  return user.data;
}

export const loadAddressList = async (token) => {
  const addRes = await authApis(token).get(endpoints["users-address_list"]);
  return addRes.data;
}

export const loadAddress = async (token, addressId) => {
  const res = await authApis(token).get(endpoints["users-address_read"](addressId));
  return res.data;
}

export const loadCart = async (token) => {
  const cartRes = await authApis(token).get(endpoints["my-cart"]);
  return cartRes.data;
}

export const loadSubCart = async (token) => {
  const subCartRes = await authApis(token).get(endpoints["sub-carts"]);
  return subCartRes.data;
}

export const loadRestaurantDetails = async (restaurantId) => {
  const restaurantRes = await Apis.get(endpoints["restaurant-details"](restaurantId));
  return restaurantRes.data;
};

export const loadFoodDetails = async (foodId) => {
  const foodRes = await Apis.get(endpoints["food-details"](foodId));
  return foodRes.data;
};

export const loadFoodReviews = async (foodId, { page }) => {
  if (page <= 0) return { results: [], next: null };

  let url = `${endpoints["food-reviews"](foodId)}?page=${page}`;
  let res = await Apis.get(url);
  return res.data;
};

export const loadRestaurantReviews = async (restaurantId, {reviewPage}) => {
  if (reviewPage <= 0) return { results: [], next: null };

  let url = `${endpoints["restaurant-reviews"](restaurantId)}?page=${reviewPage}`;
  let res = await Apis.get(url);
  return res.data;
};

export const loadUserReviewFood = async (token) => {
  const reviewRes = await authApis(token).get(endpoints["current-user-food-reviews"]);
  return reviewRes.data;
};

export const loadUserFavorite = async (token) => {
  const favRes = await authApis(token).get(endpoints["current-user-favorite"]);
  return favRes.data;
};

export const loadUserFollow = async (token) => {
  const followRes = await authApis(token).get(endpoints["current-user-follow"]);
  return followRes.data;
};

export const loadMenu = async () => {
  const menuRes = await Apis.get(endpoints["menus"]);
  return menuRes.data;
};

export const loadMenuDetails = async (menuId) => {
  const res = await Apis.get(endpoints["menus-details"](menuId));
  return res.data;
};

export const loadFoodCategory = async () => {
  let res = await Apis.get(endpoints["foods-category"]);
  return res.data;
};

export const loadFood = async ({ page, q, cateId, priceMin, priceMax }) => {
  if (page <= 0) return { results: [], next: null };
  let url = `${endpoints["foods"]}?page=${page}`;
  if (q) url += `&search=${q}`;
  if (cateId) url += `&category_id=${cateId}`;
  if (priceMin) url += `&price_min=${priceMin}`;
  if (priceMax) url += `&price_max=${priceMax}`;
  console.info("API URL:", url);

  const res = await Apis.get(url);
  return res.data;
};

export const loadOrder = async (token, { page }) => {
  if (page <= 0) return { results: [], next: null };

  let url = `${endpoints["orders"]}?page=${page}`;
  let res = await authApis(token).get(url);
  return res.data;
};

export const loadOrderDetails = async (token, orderDetailId) => {
  const res = await authApis(token).get(endpoints["orders-detail"](orderDetailId));
  return res.data;
};

export const loadOrderInfo = async (token, orderId) => {
  const res = await authApis(token).get(endpoints["orders-info"](orderId));
  return res.data;
};

export const loadRestaurantMenu = async (restaurantId) => {
  const res = await Apis.get(endpoints["restaurant-menus"](restaurantId));
  return res.data;
};

export const loadRestaurantFood = async (restaurantId, {foodPage}) => {
  if (foodPage <= 0) return { results: [], next: null };

  let url = `${endpoints["restaurant-foods"](restaurantId)}?page=${foodPage}`;
  let res = await Apis.get(url);
  return res.data;
};

export const checkOrdered = async (token, restaurantId) => {
  const res = await authApis(token).get(endpoints["check-ordered"],{
    params: { restaurant_id: restaurantId }
  });
  return res.data;
};
