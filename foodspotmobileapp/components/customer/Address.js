import React, { useState, useCallback } from "react";
import { Text, View, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import MyStyles from "../../styles/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import axios from "axios";

const Address = () => {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();
  const route = useRoute();
  const isSelectMode = route.params?.selectMode === true;

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
            const addressStr = await reverseGeocode(item.latitude, item.longitude);
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

  useFocusEffect(useCallback(() => { loadData(); }, []));

  return (
    <View style={[MyStyles.container, styles.container]}>
      {loading ? (
        <ActivityIndicator size="large" style={styles.loading} />
      ) : (
        <FlatList
          data={address}
          keyExtractor={(i) => i.id.toString()}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Hiện tại chưa có địa chỉ nào.</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                if (isSelectMode) {
                  nav.navigate("Checkout", { address: item, cart: route.params?.cart });
                } else {
                  nav.navigate("UpdateAddress", { addressId: item.id });
                }
              }}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardAddress}>{item.formatted_address}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      <TouchableOpacity style={styles.addBtn} onPress={() => nav.navigate("AddAddress")}>
        <Text style={styles.addBtnText}>Thêm địa chỉ mới</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Address;

const styles = StyleSheet.create({
  container: { paddingBottom: 60 },
  loading: { marginTop: 40 },
  emptyText: { marginTop: 24, textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 14, marginVertical: 8, borderWidth: 1, borderColor: "#ddd", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontWeight: "bold", marginBottom: 4 },
  cardAddress: { color: "#555" },
  addBtn: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#9c27b0", paddingVertical: 14, alignItems: "center" },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
