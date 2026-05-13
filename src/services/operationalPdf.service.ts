// src/services/operationalPdf.service.ts

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

import { buildOperationalOrderHTML } from '@/src/pdf/buildOperationalOrderHTML';

export async function shareOperationalOrderPdf(order: any) {
  try {
    const html = buildOperationalOrderHTML({ order });

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
      dialogTitle: 'Partager la fiche équipe',
      UTI: 'com.adobe.pdf',
    });
  } catch (error) {
    console.error('❌ shareOperationalOrderPdf error:', error);
    Alert.alert('Erreur', 'Impossible de générer ou partager la fiche équipe.');
  }
}