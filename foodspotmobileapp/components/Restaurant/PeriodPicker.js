import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const PeriodPicker = ({ onPeriodChange }) => {
  const [type, setType] = useState('month'); // Bước 1: Chọn loại thống kê
  const [month, setMonth] = useState('');
  const [quarter, setQuarter] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString()); // Bước 2: Chọn thời gian

  const years = Array.from({ length: 10 }, (_, i) => (2020 + i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const quarters = ['1', '2', '3', '4'];

  const handleSubmit = () => {
    let period = '';
    if (type === 'month' && month && year) period = `${month}/${year}`;
    else if (type === 'quarter' && quarter && year) period = `Q${quarter} ${year}`;
    else if (type === 'year' && year) period = year;
    else {
      alert('Vui lòng chọn đầy đủ thông tin thời gian (bước 1: loại thống kê, bước 2: thời gian)!');
      return;
    }
    console.log('Gửi period:', period);
    onPeriodChange(period); // Bước 3: Thống kê
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>Bước 1: Chọn loại thống kê</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={type}
          style={styles.picker}
          onValueChange={(value) => {
            setType(value);
            setMonth('');
            setQuarter('');
            console.log('Loại thống kê:', value); // Debug
          }}
        >
          <Picker.Item label="Tháng" value="month" />
          <Picker.Item label="Quý" value="quarter" />
          <Picker.Item label="Năm" value="year" />
        </Picker>
      </View>

      <Text style={styles.stepTitle}>Bước 2: Chọn thời gian</Text>
      <View style={styles.pickerContainer}>
        {type !== 'year' && (
          <Picker
            selectedValue={type === 'month' ? month : quarter}
            style={styles.picker}
            onValueChange={(value) => {
              type === 'month' ? setMonth(value) : setQuarter(value);
              console.log(type === 'month' ? 'Tháng:' : 'Quý:', value); // Debug
            }}
          >
            <Picker.Item label="Chọn" value="" />
            {(type === 'month' ? months : quarters).map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>
        )}
        <Picker
          selectedValue={year}
          style={styles.picker}
          onValueChange={(value) => {
            setYear(value);
            console.log('Năm:', value); // Debug
          }}
        >
          {years.map((y) => (
            <Picker.Item key={y} label={y} value={y} />
          ))}
        </Picker>
      </View>

      <Text style={styles.stepTitle}>Bước 3: Thống kê</Text>
      <Button title="Thống kê" onPress={handleSubmit} color="#fb8c00" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 10,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap', // Đảm bảo không bị cắt trên màn hình nhỏ
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
    width: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 10,
  },
});

export default React.memo(PeriodPicker);