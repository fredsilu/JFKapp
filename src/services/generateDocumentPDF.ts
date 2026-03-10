import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export async function generateDocumentPDF(html: string) {

  const { uri } = await Print.printToFileAsync({
    html,
  });

  return uri;
}