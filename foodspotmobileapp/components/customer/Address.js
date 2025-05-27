import { useState, useCallback } from "react";
import { Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { reverseGeocode } from "../../configs/Map";
import { checkToken, loadAddressList } from "../../configs/Data";
import styles from "../../styles/AddressStyles";

const Address = () => {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();
  const route = useRoute();
  const isSelectMode = route.params?.selectMode === true;

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await checkToken(nav);
      const addRes = await loadAddressList(token);
      const list = addRes.addresses || [];
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


