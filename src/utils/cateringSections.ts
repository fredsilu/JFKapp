// src/utils/cateringSections.ts
import {
  CateringSection,
  CateringSectionTemplate,
  CateringServiceDay,
} from "@/types/catering";

function generateId(prefix = "section") {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function positiveOrDefault(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function safeDays(value: unknown): number {
  const days = toNumber(value, 1);
  return days > 0 ? days : 1;
}

function isServiceSection(template: CateringSectionTemplate): boolean {
  const key = String(template.key || "").toLowerCase();
  const name = String(template.name || "").toLowerCase();

  return (
    template.type === "service" ||
    key.includes("service") ||
    name.includes("service")
  );
}

export const DEFAULT_CATERING_SECTION_TEMPLATES: CateringSectionTemplate[] = [
  {
    id: "main_article",
    key: "main_article",
    name: "Déjeuner",
    type: "food",
    position: 1,
    isActive: true,
  },
  {
    id: "catering_service",
    key: "catering_service",
    name: "Service traiteur",
    type: "service",
    position: 2,
    isActive: true,
  },
];

export function createEmptyServiceDay(dayNumber: number): CateringServiceDay {
  return {
    id: generateId(`service_day_${dayNumber}`),
    dayNumber,

    numberOfPeople: 0,

    serverRate: 25,
    cookRate: 50,

    numberOfServers: 0,
    numberOfCooks: 0,

    serverDailyCost: 20,
    cookDailyCost: 40,

    electricityDailyCost: 10,
    gasDailyCost: 10,
    fuelDailyCost: 10,
    extraDailyCost: 30,

    totalCost: 0,
    billedAmount: 0,
  };
}

export function createEmptySectionFromTemplate(
  template: CateringSectionTemplate
): CateringSection {
  const isService = isServiceSection(template);

  return {
    id: template.key || template.id || generateId("section"),
    key: template.key,
    kind: isService ? "service" : "article",

    name: isService ? "Service traiteur" : template.name,
    type: template.type,
    position: toNumber(template.position, 0),

    enabled: !isService,

    quantity: 0,
    unitPrice: 0,
    numberOfDays: 1,

    total: 0,

    costRate: 0,
    costAmount: 0,
    margin: 0,

    serviceMode: isService ? "identical_days" : undefined,
    serviceDays: isService ? [createEmptyServiceDay(1)] : undefined,

    notes: "",
  };
}

export function createEmptySectionsFromTemplates(
  templates: CateringSectionTemplate[] = []
): CateringSection[] {
  const source =
    templates && templates.length > 0
      ? templates
      : DEFAULT_CATERING_SECTION_TEMPLATES;

  return source
    .filter((template) => template.isActive !== false)
    .sort((a, b) => toNumber(a.position, 0) - toNumber(b.position, 0))
    .map(createEmptySectionFromTemplate);
}

function calculateArticleSection(section: CateringSection): CateringSection {
  const quantity = toNumber(section.quantity);
  const unitPrice = toNumber(section.unitPrice);
  const numberOfDays = safeDays(section.numberOfDays);
  const costRate = toNumber(section.costRate);

  const total = section.enabled ? quantity * unitPrice * numberOfDays : 0;
  const costAmount = section.enabled ? total * (costRate / 100) : 0;
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

/**
 * Ancienne règle métier :
 * coût <= 0   => 0
 * coût < 100  => 100
 * sinon arrondi au palier supérieur de 50
 *
 * Exemples :
 * 80  => 100
 * 120 => 150
 * 180 => 200
 * 230 => 250
 */
function calculateServiceUnitPriceFromCost(cost: number): number {
  if (cost <= 0) return 0;
  if (cost < 100) return 100;

  return Math.ceil(cost / 50) * 50;
}

function calculateServiceDay(day: CateringServiceDay): CateringServiceDay {
  const numberOfPeople = toNumber(day.numberOfPeople);

  const serverRate = toNumber(day.serverRate, 25);
  const cookRate = toNumber(day.cookRate, 50);

  const numberOfServers =
    serverRate > 0 && numberOfPeople > 0
      ? Math.ceil(numberOfPeople / serverRate)
      : 0;

  const numberOfCooks =
    cookRate > 0 && numberOfPeople > 0
      ? Math.ceil(numberOfPeople / cookRate)
      : 0;

  const serverDailyCost = positiveOrDefault(day.serverDailyCost, 20);
  const cookDailyCost = positiveOrDefault(day.cookDailyCost, 40);

  const electricityDailyCost = positiveOrDefault(day.electricityDailyCost, 10);
  const gasDailyCost = positiveOrDefault(day.gasDailyCost, 10);
  const fuelDailyCost = positiveOrDefault(day.fuelDailyCost, 10);

  const serversCost = numberOfServers * serverDailyCost;
  const cooksCost = numberOfCooks * cookDailyCost;

  const extraDailyCost =
    electricityDailyCost + gasDailyCost + fuelDailyCost;

  const totalCost = Math.max(
    serversCost + cooksCost + extraDailyCost,
    0
  );

  const billedAmount = calculateServiceUnitPriceFromCost(totalCost);

  return {
    ...day,
    numberOfPeople,
    serverRate,
    cookRate,

    numberOfServers,
    numberOfCooks,

    serverDailyCost,
    cookDailyCost,

    electricityDailyCost,
    gasDailyCost,
    fuelDailyCost,
    extraDailyCost,

    totalCost,
    billedAmount,
  };
}

function calculateServiceSection(section: CateringSection): CateringSection {
  if (!section.enabled) {
    return {
      ...section,
      name: "Service traiteur",
      kind: "service",
      total: 0,
      costAmount: 0,
      margin: 0,
    };
  }

  const numberOfDays = safeDays(section.numberOfDays);
  const serviceMode = section.serviceMode ?? "identical_days";

  const rawDays =
    section.serviceDays && section.serviceDays.length > 0
      ? section.serviceDays
      : [createEmptyServiceDay(1)];

  if (serviceMode === "identical_days") {
    const calculatedDay = calculateServiceDay(rawDays[0]);

    const serviceUnitPrice = toNumber(calculatedDay.billedAmount);

    const total = serviceUnitPrice * numberOfDays;
    const costAmount = toNumber(calculatedDay.totalCost) * numberOfDays;
    const margin = total - costAmount;

    return {
      ...section,
      name: "Service traiteur",
      kind: "service",
      serviceMode,
      serviceDays: [calculatedDay],
      quantity: 1,
      numberOfDays,
      unitPrice: serviceUnitPrice,
      total,
      costAmount,
      margin,
    };
  }

  const serviceDays = Array.from({ length: numberOfDays }).map(
    (_, index) => {
      return calculateServiceDay(
        rawDays[index] ?? createEmptyServiceDay(index + 1)
      );
    }
  );

  const total = serviceDays.reduce(
    (sum, day) => sum + toNumber(day.billedAmount),
    0
  );

  const costAmount = serviceDays.reduce(
    (sum, day) => sum + toNumber(day.totalCost),
    0
  );

  const margin = total - costAmount;

  return {
    ...section,
    name: "Service traiteur",
    kind: "service",
    serviceMode,
    serviceDays,
    quantity: 1,
    numberOfDays,
    unitPrice: total,
    total,
    costAmount,
    margin,
  };
}

export function calculateSection(section: CateringSection): CateringSection {
  if (section.kind === "service" || section.type === "service") {
    return calculateServiceSection(section);
  }

  return calculateArticleSection(section);
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
    (sum, section) => sum + toNumber(section.total),
    0
  );

  const totalCost = activeSections.reduce(
    (sum, section) => sum + toNumber(section.costAmount),
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