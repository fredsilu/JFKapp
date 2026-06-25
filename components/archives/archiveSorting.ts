import { ArchivedDocument } from "@/types/archives";

export function extractSortKey(doc: ArchivedDocument) {
  const text = `${doc.number ?? ""} ${doc.fileName ?? ""}`;

  const year =
    Number(text.match(/20\d{2}/)?.[0] ?? 0);

  const numbers = text.match(/\d+/g) ?? [];

  const sequence =
    Number(numbers[numbers.length - 1] ?? 0);

  return {
    year,
    sequence,
  };
}

export function sortArchivedDocuments(
  a: ArchivedDocument,
  b: ArchivedDocument
) {
  const ka = extractSortKey(a);
  const kb = extractSortKey(b);

  if (ka.year !== kb.year) {
    return kb.year - ka.year;
  }

  if (ka.sequence !== kb.sequence) {
    return kb.sequence - ka.sequence;
  }

  return (
    (b.documentDate ??
      b.invoiceDate ??
      b.eventDate ??
      "").
      localeCompare(
        a.documentDate ??
        a.invoiceDate ??
        a.eventDate ??
        ""
      )
  );
}