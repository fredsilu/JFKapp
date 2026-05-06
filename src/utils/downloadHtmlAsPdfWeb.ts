export function downloadHtmlAsPdfWeb(html: string, filename: string) {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Veuillez autoriser les popups pour générer le PDF.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}