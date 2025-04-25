import React, { useEffect, useState, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import MyStyles from "../../styles/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";

const Address = () => {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();

  const reverseGeocode = async (lat, lng) => {
    const url = "https://maps.gomaps.pro/maps/api/geocode/json";
    const params = {
      latlng: `${lat},${lng}`,
      language: "vi",
      key: "AlzaSye8iq_6m5zBA3xW9jMcCSFKajxW_y-OsMo",
    };

    const res = await axios.get(url, { params });

    if (res.data.status !== "OK" || res.data.results.length === 0)
      throw new Error("Không tìm thấy địa chỉ!");

    return res.data.results[0].formatted_address;
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        nav.replace("Login");
        return;
      }

      const addRes = await authApis(token).get(endpoints["users-address_list"]);
      const list = addRes.data.addresses || [];
      const formattedAddresses = await Promise.all(
        list.map(async (item) => {
          try {
            const addressStr = await reverseGeocode(
              item.latitude,
              item.longitude
            );
            return { ...item, formatted_address: addressStr };
          } catch {
            return { ...item, formatted_address: "Không xác định" };
          }
        })
      );
      setAddress(formattedAddresses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );


  const cardStyle = {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  };

  return (
    <View style={[MyStyles.container, { paddingBottom: 60 }]}>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={address}
          keyExtractor={(i) => i.id.toString()}
          ListEmptyComponent={() => (
            <Text style={{ marginTop: 24, textAlign: "center" }}>
              Hiện tại chưa có địa chỉ nào.
            </Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={cardStyle}
              onPress={() =>
                nav.navigate("UpdateAddress", { addressId: item.id })
              }
            >
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                {item.name}
              </Text>
              <Text style={{ color: "#555" }}>{item.formatted_address}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      <TouchableOpacity
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#9c27b0",
          paddingVertical: 14,
          alignItems: "center",
        }}
        onPress={() => nav.navigate("AddAddress")}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          Thêm địa chỉ mới
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Address;
