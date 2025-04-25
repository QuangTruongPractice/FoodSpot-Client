import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import MapView, { Marker } from 'react-native-maps'; 
import * as Location from 'expo-location';
import { TextInput } from "react-native-paper";

const AddAddress = () => {
  const nav = useNavigation();
  const [mapRegion, setMapRegion] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    street: "",
    detail: "",
    latitude: null,
    longitude: null,
    addressName: "",
  });

  const setState = (value, key) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };


  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const user = (await authApis(token).get(endpoints["current-user"])).data;
        const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

        setForm((prev) => ({
          ...prev,
          name: fullName,
          phone: user.phone_number ?? "",
        }));
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);

  const onSave = async () => {
    try {
      if (!form.addressName || !form.street) {
        alert("Vui lòng nhập đầy đủ Tên địa chỉ và Địa chỉ.");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // Gửi yêu cầu POST đến API users-address/
      await authApis(token).post(endpoints["users-address_list"], {
        latitude: form.latitude,
        longitude: form.longitude,
        name: form.addressName,
      });

      // Trở về màn hình trước
      nav.goBack();
    } catch (e) {
      console.warn(e);
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

      // Lưu lại kinh độ, vĩ độ và formattedAddress
      const formattedAddress = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
      console.info("Kinh độ:", latitude.toFixed(6), "Vĩ độ:", longitude.toFixed(6), "Địa chỉ:", formattedAddress);

      setForm({
        ...form,
        latitude,
        longitude,
        street: formattedAddress,
        formattedAddress,
      });
    }
    setShowMap(false);
  };

  const fields = [
    { label: "Họ tên", field: "name", editable: false },
    { label: "Số điện thoại", field: "phone", editable: false },
    { label: "Tên địa chỉ", field: "addressName", editable: true },
    { label: "Địa chỉ (ấn để chọn)", field: "street", editable: false, pressable: true },
    { label: "Ghi chú (không bắt buộc)", field: "detail", editable: true },
  ];

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
        {fields.map((f) => {
          const input = (
            <TextInput
              key={f.field}
              label={f.label}
              value={form[f.field]}
              onChangeText={(v) => setState(v, f.field)}
              editable={f.editable}
              mode="outlined"
              style={{ marginBottom: 18 }}
            />
          );

          return f.pressable ? (
            <TouchableOpacity key={f.field} onPress={handleAddressPress}>
              {input}
            </TouchableOpacity>
          ) : (
            input
          );
        })}

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
        style={{ backgroundColor: "#9c27b0", paddingVertical: 14, alignItems: "center" }}
        onPress={onSave}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>Lưu</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddAddress;
