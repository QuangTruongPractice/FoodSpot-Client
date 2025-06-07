import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBMfwEkw8vf6gdKgyzqgE8Fa4Stl0G0GFM",
  authDomain: "foodspot-fddb3.firebaseapp.com",
  projectId: "foodspot-fddb3",
  storageBucket: "foodspot-fddb3.firebasestorage.app",
  messagingSenderId: "824824297235",
  appId: "1:824824297235:web:0ea0d5879159b44057cce6",
  measurementId: "G-BT3CLV76LE"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);