import axios from "axios";
import qs from "qs";

const BASE_URL = "http://192.168.1.7:8000/";

export const endpoints = {
  // Foods Category
  "foods-category_list": "/foods-category/",
  "foods-category_create": "/foods-category/",
  "foods-category_read": (id) => `/foods-category/${id}/`,
  "foods-category_update": (id) => `/foods-category/${id}/`,
  "foods-category_partial_update": (id) => `/foods-category/${id}/`,
  "foods-category_delete": (id) => `/foods-category/${id}/`,

  // Foods Review
  "foods-review_list": "/foods-review/",
  "foods-review_create": "/foods-review/",
  "foods-review_read": (id) => `/foods-review/${id}/`,
  "foods-review_partial_update": (id) => `/foods-review/${id}/`,
  "foods-review_delete": (id) => `/foods-review/${id}/`,

  // Foods
  "foods_list": "/foods/",
  "foods_create": "/foods/",
  "foods_read": (id) => `/foods/${id}/`,
  "foods_update": (id) => `/foods/${id}/`,
  "foods_delete": (id) => `/foods/${id}/`,

  // Menus
  "menus_list": "/menus/",
  "menus_create": "/menus/",
  "menus_read": (id) => `/menus/${id}/`,
  "menus_update": (id) => `/menus/${id}/`,
  "menus_delete": (id) => `/menus/${id}/`,

  // Order Detail
  "order-detail_list": "/order-detail/",
  "order-detail_create": "/order-detail/",
  "order-detail_read": (id) => `/order-detail/${id}/`,
  "order-detail_update": (id) => `/order-detail/${id}/`,
  "order-detail_partial_update": (id) => `/order-detail/${id}/`,
  "order-detail_delete": (id) => `/order-detail/${id}/`,

  // Orders
  "orders_list": "/orders/",
  "orders_create": "/orders/",
  "orders_read": (id) => `/orders/${id}/`,
  "orders_partial_update": (id) => `/orders/${id}/`,
  "orders_delete": (id) => `/orders/${id}/`,

  // Restaurant Address
  "restaurant-address_list": "/restaurant-address/",
  "restaurant-address_read": (id) => `/restaurant-address/${id}/`,

  // Restaurant Review
  "restaurant-review_list": "/restaurant-review/",
  "restaurant-review_create": "/restaurant-review/",
  "restaurant-review_read": (id) => `/restaurant-review/${id}/`,
  "restaurant-review_partial_update": (id) => `/restaurant-review/${id}/`,
  "restaurant-review_delete": (id) => `/restaurant-review/${id}/`,

  // Restaurants
  "restaurants_list": "/restaurants/",
  "restaurants_create": "/restaurants/",
  "restaurants_read": (id) => `/restaurants/${id}/`,
  "restaurants_update": (id) => `/restaurants/${id}/`,
  "restaurants_delete": (id) => `/restaurants/${id}/`,

  // Sub Cart Item
  "sub-cart-item_list": "/sub-cart-item/",
  "sub-cart-item_create": "/sub-cart-item/",
  "sub-cart-item_read": (id) => `/sub-cart-item/${id}/`,
  "sub-cart-item_update": (id) => `/sub-cart-item/${id}/`,
  "sub-cart-item_delete": (id) => `/sub-cart-item/${id}/`,

  // Sub Cart
  "sub-cart_list": "/sub-cart/",
  "sub-cart_create": "/sub-cart/",
  "sub-cart_read": (id) => `/sub-cart/${id}/`,
  "sub-cart_delete": (id) => `/sub-cart/${id}/`,

  // Users Address
  "users-address_list": "/users-address/",
  "users-address_read": (id) => `/users-address/${id}/`,

  // Users
  "users_list": "/users/",
  "users_create": "/users/",
  "users_current-user_read": "/users/current-user/",
  "users_current-user_partial_update": "/users/current-user/",
  "users_read": (id) => `/users/${id}/`,
  "register": "/users/register/",
  
  // Login
  login: "/o/token/",
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    // Kiểm tra config.url trước khi gọi includes
    if (config.url && typeof config.url === "string") {
      if (config.url.includes("/o/token/") && config.method === "post") {
        config.headers["Content-Type"] = "application/x-www-form-urlencoded";
        if (config.data) {
          config.data = qs.stringify(config.data);
        }
      }
    } else {
      console.warn("Yêu cầu không có URL:", config);
    }
    console.log("Yêu cầu:", config.url, config.method, config.headers, config.data);
    return config;
  },
  (error) => {
    console.error("Lỗi yêu cầu:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("Phản hồi:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("Lỗi phản hồi:", error.message, error.response?.data);
    return Promise.reject(error);
  }
);

export const authApis = (token) => {
  if (!token || typeof token !== "string") {
    console.error("Token không hợp lệ:", token);
    throw new Error("Token không hợp lệ!");
  }

  const authApi = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 15000,
  });

  authApi.interceptors.request.use(
    (config) => {
      console.log("Yêu cầu auth:", config.url, config.method, config.headers, config.data);
      return config;
    },
    (error) => {
      console.error("Lỗi yêu cầu auth:", error);
      return Promise.reject(error);
    }
  );

  authApi.interceptors.response.use(
    (response) => {
      console.log("Phản hồi auth:", response.status, response.data);
      return response;
    },
    (error) => {
      console.error("Lỗi phản hồi auth:", error.message, error.response?.data);
      return Promise.reject(error);
    }
  );

  return authApi;
};

export default api;