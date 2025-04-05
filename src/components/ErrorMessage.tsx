import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    marginVertical: 8,
  },
  text: {
    fontFamily: 'Inter_500Medium',
    color: '#FF3B30',
    textAlign: 'center',
  },
});