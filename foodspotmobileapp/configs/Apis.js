import axios from "axios"
import qs from "qs";

const BASE_URL = 'https://tranquangtruong25.pythonanywhere.com/'

export const endpoints = {
    'orders': '/orders/',

    'foods-category': '/foods-category/',
    'foods': '/foods/',
    'food-details': (foodId) => `/foods/${foodId}/`,
    'login': '/o/token/',
    //favorite
    'favorite': '/favorite/',
    'favorite-details': (id) => `/favorite/${id}/`,
    //follow
    'follow': '/follow/',
    'follow-details': (id) => `/follow/${id}/`,
    //User
    'current-user': '/users/current-user/',
    'current-user-follow': '/users/current-user/follow/',
    'current-user-favorite': '/users/current-user/favorite/',
    //Menu
    'menus': '/menus/',
    'menus-details': (id) => `/menus/${id}/`,
    //Restaurant
    'restaurants':'/restaurants/',
    'restaurant-details': (id) => `/restaurants/${id}/`,
    'restaurant-menus': (id) => `/restaurants/${id}/menus/`,
    'restaurant-foods': (id) => `/restaurants/${id}/foods/`,

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
}

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