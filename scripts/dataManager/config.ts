//scripts/dataManager/config.ts
export type DataGroupName =
    | "master"
    | "operations"
    | "financial"
    | "all"
    | "clients"
    | "ingredients"
    | "dishes"
    | "simulations"
    | "proformas"
    | "orders"
    | "invoices"
    | "production_clean"
    | "production_seed";

export const APP_NAME = "JFKApp";

export const DATA_GROUPS: Record<DataGroupName, string[]> = {
    master: ["clients", "ingredients", "dishes"],

    operations: [
        "catering_simulations",
        "catering_proformas",
        "orders",
        "catering_invoices",
    ],
    production_clean: [
    "counters",
    "catering_simulations",
    "catering_proformas",
    "orders",
    "catering_invoices",
    "archived_documents",
],
    production_seed: [
        "clients",
        "ingredients",
        "dishes",
        "catering_service_settings",
        "catering_section_templates",
    ],

    financial: [
        "orders",
        "catering_invoices",
    ],

    all: [
        "clients",
        "ingredients",
        "dishes",
        "catering_simulations",
        "catering_proformas",
        "orders",
        "catering_invoices",
    ],

    clients: ["clients"],
    ingredients: ["ingredients"],
    dishes: ["dishes"],

    simulations: ["catering_simulations"],
    proformas: ["catering_proformas"],
    orders: ["orders"],
    invoices: ["catering_invoices"],
};

export function getCollectionsFromGroup(groupName: string): string[] {
    const group = DATA_GROUPS[groupName as DataGroupName];

    if (!group) {
        throw new Error(
            `Groupe invalide : ${groupName}. Groupes disponibles : ${Object.keys(
                DATA_GROUPS
            ).join(", ")}`
        );
    }

    return group;
}