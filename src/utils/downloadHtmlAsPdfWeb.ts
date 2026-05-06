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
  targetWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${filename}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = function () {
            setTimeout(function () {
              window.focus();
              window.print();
            }, 800);
          };
        </script>
      </body>
    </html>
  `);
  targetWindow.document.close();
}