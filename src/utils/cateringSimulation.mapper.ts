import {
  CateringSimulation,
  CateringSimulationDraft,
} from '@/types/catering';

/**
 * =========================
 * PERSISTED ➜ DRAFT
 * =========================
 */
export function simulationToDraft(
  simulation: CateringSimulation
): CateringSimulationDraft {
  const {
    breakfast,
    lunch,
    drinks,
    service,
    serviceCosts,
    name,
    clientId,
  } = simulation;

  return {
    breakfast,
    lunch,
    drinks,
    service,
    serviceCosts,
    name,
    clientId,
    dateLivraison: "",
  };
}
