export function downloadHtmlAsPdfWeb(
  html: string,
  filename: string,
  printWindow?: Window | null
) {
  if (typeof window === 'undefined') return;

  const targetWindow = printWindow || window.open('', '_blank');

  if (!targetWindow) {
    alert('Veuillez autoriser les popups pour générer le PDF.');
    return;
  }

  targetWindow.document.open();
  targetWindow.document.write(html);
  targetWindow.document.close();

  const triggerPrint = () => {
    targetWindow.focus();
    targetWindow.print();
  };

  setTimeout(triggerPrint, 1200);
}