import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { authApis, endpoints } from "../../configs/Apis";
import MapView, { Marker } from "react-native-maps";
import { TextInput } from "react-native-paper";
import { checkToken, loadUser } from "../../configs/Data";
import styles from "../../styles/AddAddressStyles";
import { fetchMapboxSuggestions, fetchMapboxPlace } from "../../configs/Map";

const AddAddress = () => {
  const nav = useNavigation();
  const [mapRegion, setMapRegion] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", street: "", detail: "",
    latitude: null, longitude: null, addressName: "",
  });
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const setState = (value, key) => setForm((prev) => ({ ...prev, [key]: value }));

  const loadUserData = async () => {
    try {
      const token = await checkToken(nav);
      const user = await loadUser(token);
      const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
      setForm((prev) => ({ ...prev, name: fullName, phone: user.phone_number ?? "" }));
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const fetchSuggestions = async (text) => {
    setQuery(text);
    const results = await fetchMapboxSuggestions(text);
    setSuggestions(results);
  };

  const handleSelectSuggestion = (item) => {
    const [longitude, latitude] = item.center;
    const placeName = item.place_name;
    setMapRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    setForm({ ...form, latitude, longitude, street: placeName });
    setQuery(placeName);
    setSuggestions([]);
    setShowMap(true);
  };

  const handleSubmitEditing = async () => {
    if (!query.trim()) return;
    const place = await fetchMapboxPlace(query);
    if (place) handleSelectSuggestion(place);
  };

  const handleMarkerDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMapRegion({ ...mapRegion, latitude, longitude });
  };

  const confirmLocation = () => {
    if (mapRegion) {
      const { latitude, longitude } = mapRegion;
      const formattedAddress = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
      setForm({ ...form, latitude, longitude, street: query, formattedAddress });
    }
    setShowMap(false);
  };

  const onSave = async () => {
    try {
      if (!form.addressName || !form.street) {
        alert("Vui lòng nhập đầy đủ Tên địa chỉ và Địa chỉ.");
        return;
      }
      const token = await checkToken(nav);
      if (!token) return;
      await authApis(token).post(endpoints["users-address_list"], {
        latitude: form.latitude, longitude: form.longitude, name: form.addressName,
      });
      nav.goBack();
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <TextInput
              label="Họ tên"
              value={form.name}
              editable={false}
              mode="outlined"
              style={styles.textInput}
            />
            <TextInput
              label="Số điện thoại"
              value={form.phone}
              editable={false}
              mode="outlined"
              style={styles.textInput}
            />
            <TextInput
              label="Tên địa chỉ"
              value={form.addressName}
              onChangeText={(v) => setState(v, "addressName")}
              mode="outlined"
              style={styles.textInput}
            />
            <TextInput
              label="Địa chỉ"
              value={query}
              onChangeText={fetchSuggestions}
              onSubmitEditing={handleSubmitEditing}
              mode="outlined"
              style={styles.textInput}
            />
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelectSuggestion(item)} style={{ padding: 10, borderBottomColor: '#ccc', borderBottomWidth: 1 }}>
            <Text>{item.place_name}</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <>
            <TextInput
              label="Ghi chú (không bắt buộc)"
              value={form.detail}
              onChangeText={(v) => setState(v, "detail")}
              mode="outlined"
              style={styles.textInput}
            />
            {showMap && mapRegion && (
              <>
                <MapView
                  style={styles.mapContainer}
                  region={mapRegion}
                  onRegionChangeComplete={(region) => setMapRegion(region)}
                >
                  <Marker coordinate={mapRegion} draggable onDragEnd={handleMarkerDragEnd} />
                </MapView>
                <TouchableOpacity style={styles.confirmBtn} onPress={confirmLocation}>
                  <Text style={styles.confirmBtnText}>Đánh dấu vị trí này</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        }
      />
      <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveBtnText}>Lưu</Text>
      </TouchableOpacity>
    </View>
  );

};

export default AddAddress;