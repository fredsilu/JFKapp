// src/utils/cateringSections.ts
import {
  CateringSection,
  CateringSectionTemplate,
} from "@/types/catering";

function generateId(prefix = "section") {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function createEmptySectionFromTemplate(
  template: CateringSectionTemplate
): CateringSection {
  return {
    id: template.key || template.id || generateId("section"),
    key: template.key,
    name: template.name,
    type: template.type,
    position: Number(template.position ?? 0),

    enabled: false,

    quantity: 0,
    unitPrice: 0,
    numberOfDays: 1,

    total: 0,

    costRate: 0,
    costAmount: 0,
    margin: 0,

    notes: "",
  };
}

export function createEmptySectionsFromTemplates(
  templates: CateringSectionTemplate[]
): CateringSection[] {
  return templates
    .filter((template) => template.isActive !== false)
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
    .map(createEmptySectionFromTemplate);
}

export function calculateSection(
  section: CateringSection
): CateringSection {
  const quantity = Number(section.quantity ?? 0);
  const unitPrice = Number(section.unitPrice ?? 0);
  const numberOfDays = Number(section.numberOfDays ?? 1);
  const costRate = Number(section.costRate ?? 0);

  const total = quantity * unitPrice * numberOfDays;
  const costAmount = total * (costRate / 100);
  const margin = total - costAmount;

  return {
    ...section,
    quantity,
    unitPrice,
    numberOfDays,
    costRate,
    total,
    costAmount,
    margin,
  };
}

export function calculateSections(
  sections: CateringSection[]
): CateringSection[] {
  return (sections ?? []).map(calculateSection);
}

export function getSectionsTotals(sections: CateringSection[]) {
  const calculatedSections = calculateSections(sections);

  const activeSections = calculatedSections.filter(
    (section) => section.enabled
  );

  const subtotal = activeSections.reduce(
    (sum, section) => sum + Number(section.total ?? 0),
    0
  );

  const totalCost = activeSections.reduce(
    (sum, section) => sum + Number(section.costAmount ?? 0),
    0
  );

  const margin = subtotal - totalCost;

  return {
    sections: calculatedSections,
    activeSections,
    subtotal,
    totalCost,
    margin,
  };
}