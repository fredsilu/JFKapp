import React from 'react';
import { View, StyleSheet, Modal as RNModal } from 'react-native';

interface ModalProps {
  visible: boolean;
  children: React.ReactNode;
}

export default function Modal({ visible, children }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {}}>
      <View style={styles.container}>{children}</View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});