// src/services/operationalManagementPdf.service.ts

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

import { buildOperationalManagementHTML } from '@/src/pdf/buildOperationalManagementHTML';

export async function shareOperationalManagementPdf(order: any) {
  try {
    const html = buildOperationalManagementHTML({ order });

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const canShare = await Sharing.isAvailableAsync();

    if (!canShare) {
      Alert.alert(
        'Partage indisponible',
        Platform.OS === 'web'
          ? 'Le partage de fichier n’est pas disponible sur cette plateforme.'
          : 'Impossible de partager ce PDF sur cet appareil.'
      );
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Partager la fiche management',
      UTI: 'com.adobe.pdf',
    });
  } catch (error) {
    console.error('❌ shareOperationalManagementPdf error:', error);
    Alert.alert(
      'Erreur',
      'Impossible de générer ou partager la fiche management.'
    );
  }
}