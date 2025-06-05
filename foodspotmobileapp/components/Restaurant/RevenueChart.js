import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const RevenueChart = ({ data, type }) => {
  console.log('Dữ liệu biểu đồ:', data); // Log để kiểm tra dữ liệu
  if (!data || data.length === 0) {
    return (
      <View>
        <Text style={{ textAlign: 'center', fontSize: 16, marginVertical: 10 }}>
          Không có dữ liệu để hiển thị biểu đồ
        </Text>
      </View>
    );
  }

  // Nếu data là mảng lồng nhau (dựa trên log trước: food_revenue: [[Object]])
  const chartDataItems = Array.isArray(data[0]) ? data[0] : data;

  const chartData = {
    labels: chartDataItems.map((item) => item.food_name || item.category || 'Không xác định'),
    datasets: [
      {
        data: chartDataItems.map((item) => item.total_revenue || item.revenue || 0),
      },
    ],
  };

  return (
    <View>
      <Text style={{ textAlign: 'center', fontSize: 16, marginVertical: 10 }}>
        Biểu đồ {type === 'food' ? 'Doanh thu món ăn' : 'Doanh thu danh mục'}
      </Text>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 40}
        height={220}
        yAxisLabel="VNĐ"
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#e26a00',
          backgroundGradientFrom: '#fb8c00',
          backgroundGradientTo: '#ffa726',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: { borderRadius: 16 },
          propsForDots: { r: '6', strokeWidth: '2', stroke: '#ffa726' },
        }}
        bezier
        style={{ marginVertical: 8, borderRadius: 16 }}
      />
    </View>
  );
};

export default React.memo(RevenueChart);