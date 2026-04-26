import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function generateDocumentPDF(html: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({
    html,
  });

  return uri;
}

export async function shareDocumentPDF(uri: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error('Le partage de fichier PDF n’est pas disponible sur cet appareil.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Partager la proforma',
    UTI: 'com.adobe.pdf',
  });
}