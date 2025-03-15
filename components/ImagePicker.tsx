import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
import { Camera, Upload } from 'lucide-react-native';

interface ImagePickerProps {
  value?: string;
  onChange: (file: File) => void;
  size?: number;
}

export default function ImagePicker({ value, onChange, size = 120 }: ImagePickerProps) {
  const handleImageSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onChange(file);
      }
    };
    input.click();
  };

  return (
    <TouchableOpacity 
      onPress={handleImageSelect}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 }
      ]}>
      {value ? (
        <Image 
          source={{ uri: value }} 
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 }
          ]} 
        />
      ) : (
        <View style={styles.placeholder}>
          <Camera size={size / 3} color="#666" />
          <Text style={styles.placeholderText}>Ajouter une photo</Text>
        </View>
      )}
      <View style={styles.uploadIcon}>
        <Upload size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  uploadIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});