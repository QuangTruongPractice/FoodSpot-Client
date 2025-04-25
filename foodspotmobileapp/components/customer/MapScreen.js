import React from "react";
import { View, Text, Button } from "react-native";
import { WebView } from "react-native-webview";

const MapScreen = ({ route }) => {
  const { latitude, longitude, address } = route.params; // Nhận latitude, longitude và address từ navigation

  const mapUrl = `https://maps.gomaps.pro/maps?latitude=${latitude}&longitude=${longitude}&zoom=15&key=AlzaSye8iq_6m5zBA3xW9jMcCSFKajxW_y-OsMo`; // Sử dụng URL của Go Map API

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", margin: 10 }}>
        Địa chỉ: {address}
      </Text>
      <WebView source={{ uri: mapUrl }} style={{ flex: 1 }} />
    </View>
  );
};

export default MapScreen;
