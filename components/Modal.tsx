import React from 'react';
import {
  View,
  StyleSheet,
  Modal as RNModal,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface ModalProps {
  visible: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  title?: string;
}

export default function Modal({
  visible,
  children,
  onClose,
  title,
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* HEADER */}
        {(title || onClose) && (
          <View style={styles.header}>
            <Text style={styles.title}>{title || ''}</Text>

            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* CONTENT */}
        <ScrollView contentContainerStyle={styles.content}>
          {children}
        </ScrollView>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  closeButton: {
    padding: 4,
  },

  closeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#666',
  },

  content: {
    padding: 16,
    paddingBottom: 30,
  },
});
