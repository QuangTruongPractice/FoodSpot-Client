import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import MapView, { Marker } from 'react-native-maps'; 
import * as Location from 'expo-location';
import { TextInput } from "react-native-paper";

const UpdateAddress = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { addressId } = route.params; // Lấy id của địa chỉ từ màn hình trước

  const [mapRegion, setMapRegion] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [form, setForm] = useState({
    addressName: "",
    street: "",
    latitude: null,
    longitude: null,
  });

  // Fetch thông tin địa chỉ khi nhận được addressId
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const response = await authApis(token).get(`${endpoints["users-address_read"](addressId)}`);
        const address = response.data;

        setForm({
          addressName: address.name, // Điền tên địa chỉ vào ô "Tên địa chỉ"
          street: `Lat: ${address.latitude}, Lng: ${address.longitude}`, // Điền vĩ độ và kinh độ vào ô "Địa chỉ"
          latitude: address.latitude,
          longitude: address.longitude,
        });

        setMapRegion({
          latitude: address.latitude,
          longitude: address.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

      } catch (err) {
        console.warn("Lỗi khi lấy địa chỉ:", err);
      }
    };

    if (addressId) {
      fetchAddress();
    }
  }, [addressId]);

  const setState = (value, key) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await authApis(token).put(`${endpoints["users-address_read"](addressId)}`, {
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
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await authApis(token).delete(`${endpoints["users-address_read"](addressId)}`);

      navigation.goBack();
    } catch (err) {
      console.warn("Lỗi khi xóa địa chỉ:", err);
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Không có quyền truy cập vị trí!');
        return null;
      }

      let location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch (error) {
      console.error("Lỗi khi lấy vị trí GPS:", error);
      return null;
    }
  };

  const handleAddressPress = async () => {
    const location = await getCurrentLocation();
    if (!location) return;

    setMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    setShowMap(true);
  };

  const handleMarkerDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMapRegion({
      ...mapRegion,
      latitude,
      longitude,
    });
  };

  const confirmLocation = async () => {
    if (mapRegion) {
      const { latitude, longitude } = mapRegion;
      const formattedAddress = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
      setForm({
        ...form,
        latitude,
        longitude,
        street: formattedAddress,
      });
    }
    setShowMap(false);
  };

  const styles = StyleSheet.create({
    mapContainer: {
      width: '100%',
      height: 300,
      marginVertical: 20,
    },
    confirmBtn: {
      backgroundColor: "#2196F3",
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 10,
    },
    confirmBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    saveBtn: {
      backgroundColor: "#9c27b0",
      paddingVertical: 14,
      alignItems: "center",
      margin: 5,
    },
    saveBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
  });

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

        <TouchableOpacity onPress={handleAddressPress}>
          <TextInput
            label="Địa chỉ (ấn để chọn)"
            value={form.street}
            editable={false}
            mode="outlined"
            style={{ marginBottom: 18 }}
          />
        </TouchableOpacity>

        {showMap && mapRegion && (
          <>
            <MapView
              style={styles.mapContainer}
              showsUserLocation={true}
              loadingEnabled={true}
              region={mapRegion}
              onRegionChangeComplete={(region) => setMapRegion(region)}
            >
              <Marker
                coordinate={mapRegion}
                draggable
                onDragEnd={handleMarkerDragEnd}
              />
            </MapView>

            <TouchableOpacity style={styles.confirmBtn} onPress={confirmLocation}>
              <Text style={styles.confirmBtnText}>Đánh dấu vị trí này</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={onUpdate}
      >
        <Text style={styles.saveBtnText}>Cập nhật</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={onDelete}
      >
        <Text style={styles.saveBtnText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  );
};

export default UpdateAddress;
