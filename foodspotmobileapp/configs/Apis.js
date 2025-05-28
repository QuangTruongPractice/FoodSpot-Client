import axios from "axios"
import qs from "qs";

const BASE_URL = 'http://169.254.17.234:8000/';

export const endpoints = {
    //order
    'orders': '/orders/',
    'orders-info': (orderId) => `/orders/${orderId}/`,
    'orders-detail': (id) => `/order-detail/${id}/`,
    'checkout': '/orders/checkout/',
    'check-ordered': 'check-ordered',

    //payment
    'momo-payment': '/momo-payment/',
    //food
    'foods-category': '/foods-category/',
    'foods': '/foods/',
    'food-details': (foodId) => `/foods/${foodId}/`,
    'food-reviews': (foodId) => `/foods/${foodId}/reviews/`,
    
    //User
    'current-user': '/users/current-user/',
    'current-user-follow': '/users/current-user/follow/',
    'current-user-favorite': '/users/current-user/favorite/',
    'current-user-food-reviews': '/users/current-user/food-reviews/',
    //Menu
    'menus': '/menus/',
    'menus-details': (id) => `/menus/${id}/`,
    //Restaurant
    'restaurants':'/restaurants/',
    'restaurant-details': (id) => `/restaurants/${id}/`,
    'restaurant-menus': (id) => `/restaurants/${id}/menus/`,
    'restaurant-foods': (id) => `/restaurants/${id}/foods/`,
    'restaurant-reviews': (id) => `/restaurants/${id}/reviews/`,

    // Users Address
    "users-address_list": "/users-address/",
    "users-address_read": (id) => `/users-address/${id}/`,

    // Users
    "users_list": "/users/",
    "users_create": "/users/",
    "users_read": (id) => `/users/${id}/`,
    "register": "/users/register-customer/",
    'login': '/o/token/',

    //Cart
    'add-to-cart': '/add-to-cart/',
    'my-cart': '/cart/my-cart/',
    'delete-cart': cartId => `/cart/${cartId}/`,
    'sub-carts': '/cart/sub-carts/',
    'delete-multiple-sub-carts': '/sub-cart/delete-sub-carts/',
    'delete-multiple-items': '/sub-cart-item/delete-multiple/',
    'restaurant-sub-cart': '/sub-cart/restaurant-sub-cart/',
    'update-sub-cart-item': '/update-sub-cart-item/',

    //Reviews
    'reviews-restaurant': '/restaurant-review/',
    'reviews-food': '/foods-review/',
    'reviews-restaurant-detail': (id) => `/restaurant-review/${id}/`,
    'reviews-food-detail': (id) => `/foods-review/${id}/`,
  }

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
  });
  
  api.interceptors.request.use(
    (config) => {
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
      console.log("Phản hồi:", response.status, response.data)
      return response
    },
    (error) => {
      const errorMessage =
        error.response?.data?.error ||
        (error.message.includes("timeout")
          ? "Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại!"
          : "Lỗi không xác định")
      console.error("Lỗi phản hồi:", errorMessage, error.response?.data)
      return Promise.reject({ ...error, message: errorMessage })
    }
  )
  
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