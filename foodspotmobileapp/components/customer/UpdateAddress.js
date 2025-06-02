import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { authApis, endpoints } from "../../configs/Apis";
import MapView, { Marker } from "react-native-maps";
import { TextInput } from "react-native-paper";
import { checkToken, loadAddress } from "../../configs/Data";
import styles from "../../styles/UpdateAddressStyles";

const UpdateAddress = () => {
  const navigation = useNavigation();
  const { addressId } = useRoute().params;

  const [form, setForm] = useState({ addressName: "", street: "", latitude: null, longitude: null });
  const [mapRegion, setMapRegion] = useState(null);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const token = await checkToken(navigation);
        const address = await loadAddress(token, addressId);
        const latitude = address.latitude;
        const longitude = address.longitude;
        setForm({
          addressName: address.name,
          street: `Lat: ${latitude}, Lng: ${longitude}`,
          latitude,
          longitude,
        });
        setMapRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      } catch (err) {
        console.warn("Lỗi khi lấy địa chỉ:", err);
      }
    };
    if (addressId) fetchAddress();
  }, [addressId]);

  const setState = (value, key) => setForm((prev) => ({ ...prev, [key]: value }));

  const onUpdate = async () => {
    try {
      const token = await checkToken(navigation);
      await authApis(token).put(endpoints["users-address_read"](addressId), {
        name: form.addressName,
        latitude: form.latitude,
        longitude: form.longitude,
      });
      navigation.goBack();
    } catch (err) {
      console.warn("Lỗi khi cập nhật địa chỉ:", err);
    }
  };

  const onDelete = async () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa địa chỉ này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            const token = await checkToken(navigation);
            if (!token) return;
            await authApis(token).delete(`${endpoints["users-address_read"](addressId)}`);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleMarkerDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMapRegion((prev) => ({ ...prev, latitude, longitude }));
  };

  const confirmLocation = () => {
    if (mapRegion) {
      setForm((prev) => ({
        ...prev,
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
        street: `Lat: ${mapRegion.latitude.toFixed(6)}, Lng: ${mapRegion.longitude.toFixed(6)}`,
      }));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ padding: 20 }}>
        <TextInput
          label="Tên địa chỉ"
          value={form.addressName}
          onChangeText={(v) => setState(v, "addressName")}
          mode="outlined"
          style={{ marginBottom: 18 }}
        />

        <TextInput
          label="Địa chỉ"
          value={form.street}
          editable={false}
          mode="outlined"
          style={{ marginBottom: 18 }}
        />

        {mapRegion && (
          <>
            <MapView
              style={styles.mapContainer}
              showsUserLocation={false}
              loadingEnabled
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
            >
              <Marker coordinate={mapRegion} draggable onDragEnd={handleMarkerDragEnd} />
            </MapView>
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.saveBtn} onPress={onUpdate}>
        <Text style={styles.saveBtnText}>Cập nhật</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={onDelete}>
        <Text style={styles.saveBtnText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  );
};

export default UpdateAddress;
