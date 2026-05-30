//src/services/generateDocumentPDF.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

function sanitizeFileName(value?: string | null): string {
  return String(value || 'document')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

export async function generateDocumentPDF(
  html: string,
  filename = 'document.pdf'
): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html });

  const cleanFilename =
    sanitizeFileName(filename.replace(/\.pdf$/i, '')) + '.pdf';

  const newUri = `${FileSystem.cacheDirectory}${cleanFilename}`;

  await FileSystem.copyAsync({
    from: uri,
    to: newUri,
  });

  return newUri;
}

export async function shareDocumentPDF(
  uri: string,
  title = 'Partager le document'
): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error('Le partage de fichier PDF n’est pas disponible sur cet appareil.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: title,
    UTI: 'com.adobe.pdf',
  });
}