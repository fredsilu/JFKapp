import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import {
  IS_TEST,
  APP_ENV,
} from '@/lib/firebase';

export default function EnvironmentBadge() {
  return (
    <View
      style={[
        styles.container,
        IS_TEST
          ? styles.testContainer
          : styles.productionContainer,
      ]}
    >
      <Text style={styles.text}>
        {IS_TEST ? 'MODE TEST' : 'PRODUCTION'}
      </Text>

      <Text style={styles.subText}>
        {APP_ENV.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },

  testContainer: {
    backgroundColor: '#d32f2f',
  },

  productionContainer: {
    backgroundColor: '#2e7d32',
  },

  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },

  subText: {
    color: 'white',
    fontSize: 10,
    opacity: 0.9,
  },
});