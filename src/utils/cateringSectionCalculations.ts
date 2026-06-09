// src/utils/cateringSectionCalculations.ts
import { CateringSection } from "@/types/catering";
import {
    calculateSections,
    getSectionsTotals,
} from "@/src/utils/cateringSections";

export type CateringSectionsCalculationResult = {
    sections: CateringSection[];
    activeSections: CateringSection[];

    globalTurnover: number;
    globalCost: number;
    globalMargin: number;

    discount: number;
    finalTurnover: number;
    finalMargin: number;
};

export function calculateSectionsSimulation(
    sections: CateringSection[],
    discount = 0
): CateringSectionsCalculationResult {
    const calculatedSections = calculateSections(sections);
    const totals = getSectionsTotals(calculatedSections);

    const globalTurnover = totals.subtotal;
    const globalCost = totals.totalCost;
    const globalMargin = totals.margin;

    const cleanDiscount = Number(discount ?? 0);
    const finalTurnover = Math.max(globalTurnover - cleanDiscount, 0);
    const finalMargin = finalTurnover - globalCost;

    return {
        sections: calculatedSections,
        activeSections: totals.activeSections,

        globalTurnover,
        globalCost,
        globalMargin,

        discount: cleanDiscount,
        finalTurnover,
        finalMargin,
    };
}