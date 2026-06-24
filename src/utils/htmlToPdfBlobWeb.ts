export async function htmlToPdfBlobWeb(
  html: string,
  filename: string
): Promise<Blob> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Génération PDF Web indisponible hors navigateur.");
  }

  const html2pdfModule = await import("html2pdf.js");
  const html2pdf = html2pdfModule.default || html2pdfModule;

  const wrapper = document.createElement("div");

  wrapper.style.position = "fixed";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.width = "794px";
  wrapper.style.minHeight = "1123px";
  wrapper.style.backgroundColor = "#ffffff";
  wrapper.style.zIndex = "-9999";
  wrapper.style.opacity = "1";
  wrapper.style.pointerEvents = "none";
  wrapper.style.overflow = "visible";

  wrapper.innerHTML = html;

  document.body.appendChild(wrapper);

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const images = Array.from(wrapper.querySelectorAll("img"));

    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );

    const worker = html2pdf()
      .set({
        margin: [0, 0, 0, 0],
        filename,
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          windowWidth: 794,
          windowHeight: Math.max(wrapper.scrollHeight, 1123),
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: {
          unit: "px",
          format: [794, 1123],
          orientation: "portrait",
        },
      })
      .from(wrapper)
      .toPdf();

    const pdf = await worker.get("pdf");
    return pdf.output("blob");
  } finally {
    document.body.removeChild(wrapper);
  }
}