import axios from "axios"

const BASE_URL = 'https://tranquangtruong25.pythonanywhere.com/'

export const endpoints = {
    'orders': '/orders/',
    'foods-category': '/foods-category/',
    'foods': '/foods/',
}

export default axios.create({
    baseURL: BASE_URL
});