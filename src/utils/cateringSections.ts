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

function isServiceSection(template: CateringSectionTemplate): boolean {
  const key = String(template.key || "").toLowerCase();
  const name = String(template.name || "").toLowerCase();

  return (
    template.type === "service" ||
    key.includes("service") ||
    name.includes("service")
  );
}

export function createEmptyServiceDay(dayNumber: number): CateringServiceDay {
  return {
    id: generateId(`service_day_${dayNumber}`),
    dayNumber,

    numberOfPeople: 0,

    serverRate: 25,
    cookRate: 50,

    numberOfServers: 0,
    numberOfCooks: 0,

    serverDailyCost: 0,
    cookDailyCost: 0,

    extraDailyCost: 0,

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
    position: Number(template.position ?? 0),

    enabled: false,

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
  templates: CateringSectionTemplate[]
): CateringSection[] {
  return templates
    .filter((template) => template.isActive !== false)
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
    .map(createEmptySectionFromTemplate);
}

function calculateArticleSection(section: CateringSection): CateringSection {
  const quantity = Number(section.quantity ?? 0);
  const unitPrice = Number(section.unitPrice ?? 0);
  const numberOfDays = Number(section.numberOfDays ?? 1);
  const costRate = Number(section.costRate ?? 0);

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

function calculateServiceDay(day: CateringServiceDay): CateringServiceDay {
  const numberOfPeople = Number(day.numberOfPeople ?? 0);

  const serverRate = Number(day.serverRate ?? 25);
  const cookRate = Number(day.cookRate ?? 50);

  const numberOfServers =
    serverRate > 0 ? Math.ceil(numberOfPeople / serverRate) : 0;

  const numberOfCooks =
    cookRate > 0 ? Math.ceil(numberOfPeople / cookRate) : 0;

  const serverDailyCost = Number(day.serverDailyCost ?? 0);
  const cookDailyCost = Number(day.cookDailyCost ?? 0);
  const extraDailyCost = Number(day.extraDailyCost ?? 0);

  const totalCost =
    numberOfServers * serverDailyCost +
    numberOfCooks * cookDailyCost +
    extraDailyCost;

  const billedAmount = Number(day.billedAmount ?? 0);

  return {
    ...day,
    numberOfPeople,
    serverRate,
    cookRate,
    numberOfServers,
    numberOfCooks,
    serverDailyCost,
    cookDailyCost,
    extraDailyCost,
    totalCost,
    billedAmount,
  };
}

function calculateServiceSection(section: CateringSection): CateringSection {
  if (!section.enabled) {
    return {
      ...section,
      total: 0,
      costAmount: 0,
      margin: 0,
    };
  }

  const numberOfDays = Math.max(Number(section.numberOfDays ?? 1), 1);
  const serviceMode = section.serviceMode ?? "identical_days";

  const rawDays =
    section.serviceDays && section.serviceDays.length > 0
      ? section.serviceDays
      : [createEmptyServiceDay(1)];

  let serviceDays: CateringServiceDay[] = [];

  if (serviceMode === "identical_days") {
    const calculatedDay = calculateServiceDay(rawDays[0]);

    const total = Number(section.unitPrice ?? calculatedDay.billedAmount ?? 0) * numberOfDays;
    const costAmount = calculatedDay.totalCost * numberOfDays;

    return {
      ...section,
      name: "Service traiteur",
      kind: "service",
      serviceMode,
      serviceDays: [calculatedDay],
      quantity: 1,
      numberOfDays,
      unitPrice: Number(section.unitPrice ?? calculatedDay.billedAmount ?? 0),
      total,
      costAmount,
      margin: total - costAmount,
    };
  }

  serviceDays = Array.from({ length: numberOfDays }).map((_, index) => {
    return calculateServiceDay(
      rawDays[index] ?? createEmptyServiceDay(index + 1)
    );
  });

  const total = serviceDays.reduce(
    (sum, day) => sum + Number(day.billedAmount ?? 0),
    0
  );

  const costAmount = serviceDays.reduce(
    (sum, day) => sum + Number(day.totalCost ?? 0),
    0
  );

  return {
    ...section,
    name: "Forfait Service traiteur",
    kind: "service",
    serviceMode,
    serviceDays,
    quantity: 1,
    numberOfDays: 1,
    unitPrice: total,
    total,
    costAmount,
    margin: total - costAmount,
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