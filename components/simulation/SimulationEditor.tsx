// components/simulation/SimulationEditor.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import ArticleSectionCard from "@/components/simulation/ArticleSectionCard";
import ServiceSectionCard from "@/components/simulation/ServiceSectionCard";

import {
  CateringSection,
  CateringServiceDay,
} from "@/types/catering";

import {
  calculateSection,
  createEmptySectionsFromTemplates,
  getSectionsTotals,
} from "@/src/utils/cateringSections";

import { getCateringSectionTemplates } from "@/src/services/cateringSectionTemplate.service";

import {
  CateringServiceSettings,
  getCateringServiceSettings,
} from "@/src/services/cateringServiceSettings.service";

const ARTICLE_LABELS = [
  "Petit-déjeuner",
  "Déjeuner",
  "Dîner",
  "Brunch",
  "Cocktail",
  "Boissons",
  "Autre",
];

type SimulationEditorSubmitPayload = {
  eventName: string;
  eventDate: string;
  clientName: string;
  numberOfPeople: number;
  dateLivraison: string;
  discount: number;
  deliveryTime: string;
  servicePeriod: string;
  deliveryAddress: string;
  comment: string;
  sections: CateringSection[];
  totals: {
    subtotal: number;
    discountAmount: number;
    grandTotal: number;
    totalCost: number;
    margin: number;
  };
};

type Props = {
  title?: string;
  initialEventName?: string;
  initialClientName?: string;
  initialNumberOfPeople?: number;
  initialSections?: CateringSection[];
  initialDateLivraison?: string;
  initialDeliveryTime?: string;
  initialServicePeriod?: string;
  initialDeliveryAddress?: string;
  initialComment?: string;
  submitLabel?: string;
  initialEventDate?: string;
  initialDiscount?: number;
  saving?: boolean;
  onSubmit: (payload: SimulationEditorSubmitPayload) => Promise<void>;
};

export default function SimulationEditor({
  title = "Simulation",
  initialEventName = "",
  initialClientName = "",
  initialDateLivraison = "",
  initialDeliveryTime = "",
  initialServicePeriod = "",
  initialDeliveryAddress = "",
  initialComment = "",
  initialNumberOfPeople = 0,
  initialEventDate = "",
  initialDiscount = 0,
  initialSections,
  submitLabel = "Enregistrer",
  saving = false,
  onSubmit,
}: Props) {
  const [eventName, setEventName] = useState(initialEventName);
  const [eventDate, setEventDate] = useState(initialEventDate);
  const [clientName, setClientName] = useState(initialClientName);
  const [numberOfPeople, setNumberOfPeople] = useState(
    String(initialNumberOfPeople || 0)
  );

  const [dateLivraison, setDateLivraison] = useState(initialDateLivraison);
  const [deliveryTime, setDeliveryTime] = useState(initialDeliveryTime);
  const [deliveryAddress, setDeliveryAddress] = useState(initialDeliveryAddress);
  const [comment, setComment] = useState(initialComment);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);

  const [servicePeriod, setServicePeriod] =
    useState(initialServicePeriod);

  const [sections, setSections] = useState<CateringSection[]>([]);
  const [serviceSettings, setServiceSettings] =
    useState<CateringServiceSettings | null>(null);

  const [discountAmount, setDiscountAmount] = useState(String(initialDiscount || 0));

  const [loading, setLoading] = useState(true);

  const [formError, setFormError] = useState("");


  useEffect(() => {
    loadInitialData();
  }, []);


  function addArticleSection(label: string) {
    const id = `article_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const newSection: CateringSection = calculateSection({
      id,
      key: id,
      kind: "article",
      name: label === "Autre" ? "Nouvelle rubrique" : label,
      type: label === "Boissons" ? "drink" : "food",
      position: sections.length + 1,
      enabled: true,
      billingMode: "perDay",
      quantity: Number(numberOfPeople) || 0,
      unitPrice: 0,
      numberOfDays: 1,
      total: 0,
      costRate: 0,
      costAmount: 0,
      margin: 0,
      notes: "",
    });

    setSections((prev) => {
      const articles = prev.filter((section) => section.kind !== "service");
      const service = prev.find((section) => section.kind === "service");

      return [...articles, newSection, ...(service ? [service] : [])];
    });
  }

  async function loadInitialData() {
    try {
      setLoading(true);

      const settings = await getCateringServiceSettings();
      setServiceSettings(settings);

      if (initialSections?.length) {
        setSections(initialSections.map(calculateSection));
        return;
      }

      let templates: any[] = [];

      try {
        templates = await getCateringSectionTemplates();
      } catch (error) {
        console.warn("Templates Firestore indisponibles, fallback local utilisé:", error);
        templates = [];
      }

      const emptySections = createEmptySectionsFromTemplates(templates);
      const fallbackSections: CateringSection[] = [
        {
          id: "article_dejeuner",
          key: "dejeuner",
          kind: "article",
          name: "Déjeuner",
          type: "food",
          position: 1,
          enabled: true,
          billingMode: "perDay",
          quantity: 0,
          unitPrice: 0,
          numberOfDays: 1,
          total: 0,
          costRate: 0,
          costAmount: 0,
          margin: 0,
          notes: "",
        },
        {
          id: "service_traiteur",
          key: "service_traiteur",
          kind: "service",
          name: "Service traiteur",
          type: "service",
          position: 2,
          enabled: false,
          quantity: 1,
          unitPrice: 0,
          numberOfDays: 1,
          total: 0,
          costRate: 0,
          costAmount: 0,
          margin: 0,
          serviceMode: "identical_days",
          serviceDays: [createServiceDay(1, settings)],
          notes: "",
        },
      ];



      const sectionsSource =
        emptySections.length > 0 ? emptySections : fallbackSections;

      const hydratedSections = sectionsSource.map((section) => {
        const normalizedSection: CateringSection = {
          ...section,
          billingMode: section.billingMode ?? "perDay",
        };

        if (normalizedSection.kind !== "service") {
          return normalizedSection;
        }

        return {
          ...normalizedSection,
          serviceDays: [
            {
              ...(normalizedSection.serviceDays?.[0] ?? createServiceDay(1, settings)),
              serverRate: settings.defaultServerRate ?? 25,
              cookRate: settings.defaultCookRate ?? 50,
              serverDailyCost: settings.serverDailyCost ?? 20,
              cookDailyCost: settings.cookDailyCost ?? 40,
              electricityDailyCost: settings.electricityDailyCost ?? 10,
              gasDailyCost: settings.gasDailyCost ?? 10,
              fuelDailyCost: settings.fuelDailyCost ?? 10,
              extraDailyCost:
                (settings.electricityDailyCost ?? 10) +
                (settings.gasDailyCost ?? 10) +
                (settings.fuelDailyCost ?? 10),
            },
          ],
        };
      });

      setSections(hydratedSections.map(calculateSection));
    } catch (error) {
      console.error("Erreur chargement éditeur simulation:", error);
      Alert.alert("Erreur", "Impossible de charger l’éditeur.");
    } finally {
      setLoading(false);
    }
  }

  function formatDateFr(date: Date) {
    return date.toLocaleDateString("fr-FR");
  }

  function parseFrenchDate(value: string) {
    const [day, month, year] = value.split("/").map(Number);

    if (!day || !month || !year) {
      return new Date();
    }

    return new Date(year, month - 1, day);
  }
  function createServiceDay(
    dayNumber: number,
    settings = serviceSettings
  ): CateringServiceDay {
    return {
      id: `service_day_${dayNumber}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      dayNumber,
      numberOfPeople: Number(numberOfPeople) || 0,
      serverRate: settings?.defaultServerRate ?? 25,
      cookRate: settings?.defaultCookRate ?? 50,
      numberOfServers: 0,
      numberOfCooks: 0,

      serverDailyCost: settings?.serverDailyCost ?? 20,
      cookDailyCost: settings?.cookDailyCost ?? 40,
      electricityDailyCost: settings?.electricityDailyCost ?? 10,
      gasDailyCost: settings?.gasDailyCost ?? 10,
      fuelDailyCost: settings?.fuelDailyCost ?? 10,

      extraDailyCost:
        (settings?.electricityDailyCost ?? 10) +
        (settings?.gasDailyCost ?? 10) +
        (settings?.fuelDailyCost ?? 10),

      totalCost: 0,
      billedAmount: 0,
    };
  }

  function normalizeServiceDays(
    section: CateringSection,
    nextNumberOfDays: number
  ): CateringServiceDay[] {
    const count = Math.max(Number(nextNumberOfDays || 1), 1);
    const existingDays = section.serviceDays ?? [];

    if (section.serviceMode !== "different_days") {
      return existingDays.length > 0 ? [existingDays[0]] : [createServiceDay(1)];
    }

    return Array.from({ length: count }).map((_, index) => {
      return existingDays[index] ?? createServiceDay(index + 1);
    });
  }

  function formatFrenchDate(value: string) {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4)
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;

    return `${numbers.slice(0, 2)}/${numbers.slice(
      2,
      4
    )}/${numbers.slice(4, 8)}`;
  }

  function updateSectionField(
    sectionId: string,
    field: keyof CateringSection,
    value: any
  ) {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        const nextSection: CateringSection = {
          ...section,
          [field]: value,
        };

        if (
          nextSection.kind === "service" &&
          (field === "numberOfDays" || field === "serviceMode")
        ) {
          nextSection.serviceDays = normalizeServiceDays(
            nextSection,
            Number(nextSection.numberOfDays ?? 1)
          );
        }

        return calculateSection(nextSection);
      })
    );
  }

  function updateServiceDay(
    sectionId: string,
    dayId: string,
    field: keyof CateringServiceDay,
    value: any
  ) {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        const updatedSection: CateringSection = {
          ...section,
          serviceDays: (section.serviceDays ?? []).map((day) =>
            day.id === dayId
              ? {
                ...day,
                [field]: value,
              }
              : day
          ),
        };

        return calculateSection(updatedSection);
      })
    );
  }

  const totals = useMemo(() => {
    return getSectionsTotals(sections);
  }, [sections]);

  const discount = Number(discountAmount) || 0;
  const grandTotal = Math.max(totals.subtotal - discount, 0);
  const finalMargin = grandTotal - totals.totalCost;

  async function handleSubmit() {

    try {
      setFormError("");

      if (!eventName.trim()) {
        setFormError("Veuillez saisir le nom de l’événement.");
        return;
      }


      await onSubmit({
        eventName: eventName.trim(),
        eventDate,
        dateLivraison,
        servicePeriod,
        deliveryTime,
        deliveryAddress,
        comment,
        clientName: clientName.trim(),
        numberOfPeople: Number(numberOfPeople) || 0,
        discount,
        sections: totals.sections,
        totals: {
          subtotal: totals.subtotal,
          discountAmount: discount,
          grandTotal,
          totalCost: totals.totalCost,
          margin: finalMargin,
        },
      });
    } catch (error) {
      console.error("Erreur enregistrement simulation:", error);
      setFormError("Impossible d’enregistrer la simulation. Vérifie la console.");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingTitle}>Chargement du calculateur</Text>
          <Text style={styles.loadingText}>
            Préparation des rubriques et paramètres du service traiteur...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations générales</Text>

          <Text style={styles.label}>Nom de l’événement</Text>
          <TextInput
            value={eventName}
            onChangeText={setEventName}
            placeholder="Ex: Cocktail entreprise"
            style={styles.input}
          />
          <Text style={styles.label}>Date événement</Text>

          {Platform.OS === "web" ? (
            <TextInput
              value={eventDate}
              onChangeText={(value) => setEventDate(formatFrenchDate(value))}
              placeholder="JJ/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
              style={styles.input}
            />
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setShowEventDatePicker(true)}
                style={styles.datePickerButton}
              >
                <Text
                  style={[
                    styles.datePickerText,
                    !eventDate && styles.datePickerPlaceholder,
                  ]}
                >
                  {eventDate || "Choisir une date"}
                </Text>
              </TouchableOpacity>

              {showEventDatePicker && (
                <DateTimePicker
                  value={eventDate ? parseFrenchDate(eventDate) : new Date()}
                  mode="date"
                  display="default"
                  locale="fr-FR"
                  onChange={(event, selectedDate) => {
                    setShowEventDatePicker(false);

                    if (selectedDate) {
                      setEventDate(formatDateFr(selectedDate));
                    }
                  }}
                />
              )}
            </>
          )}

          <Text style={styles.label}>Client</Text>
          <TextInput
            value={clientName}
            onChangeText={setClientName}
            placeholder="Nom du client"
            style={styles.input}
          />

          <Text style={styles.label}>Nombre de personnes</Text>
          <TextInput
            value={numberOfPeople}
            onChangeText={setNumberOfPeople}
            keyboardType="numeric"
            placeholder="Ex : 100"
            style={styles.input}
          />

          <Text style={styles.label}>Date livraison</Text>

          {Platform.OS === "web" ? (
            <TextInput
              value={dateLivraison}
              onChangeText={(value) => setDateLivraison(formatFrenchDate(value))}
              placeholder="JJ/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
              style={styles.input}
            />
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setShowDeliveryDatePicker(true)}
                style={styles.datePickerButton}
              >
                <Text
                  style={[
                    styles.datePickerText,
                    !dateLivraison && styles.datePickerPlaceholder,
                  ]}
                >
                  {dateLivraison || "Choisir une date"}
                </Text>
              </TouchableOpacity>

              {showDeliveryDatePicker && (
                <DateTimePicker
                  value={dateLivraison ? parseFrenchDate(dateLivraison) : new Date()}
                  mode="date"
                  display="default"
                  locale="fr-FR"
                  onChange={(event, selectedDate) => {
                    setShowDeliveryDatePicker(false);

                    if (selectedDate) {
                      setDateLivraison(formatDateFr(selectedDate));
                    }
                  }}
                />
              )}
            </>
          )}
          <Text style={styles.label}>Période de prestation</Text>
          <TextInput
            value={servicePeriod}
            onChangeText={setServicePeriod}
            placeholder="Ex : Du 12/06/2026 au 26/06/2026"
            style={styles.input}
          />
          <Text style={styles.label}>Heure livraison</Text>
          <TextInput
            value={deliveryTime}
            onChangeText={setDeliveryTime}
            placeholder="Ex: 12h30"
            style={styles.input}
          />

          <Text style={styles.label}>Lieu livraison</Text>
          <TextInput
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="Adresse de livraison"
            style={styles.input}
          />

          <Text style={styles.label}>Commentaire</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Instructions ou commentaire"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.input, styles.textArea]}
          />
        </View>

        {sections
          .filter((section) => section.kind !== "service")
          .map((section) => (
            <ArticleSectionCard
              key={section.id}
              section={section}
              onUpdate={updateSectionField}
            />
          ))}

        <TouchableOpacity
          onPress={() => setShowAddSectionModal(true)}
          style={styles.addMainButton}
        >
          <Text style={styles.addMainButtonText}>+ Ajouter une rubrique</Text>
        </TouchableOpacity>

        {sections
          .filter((section) => section.kind === "service")
          .map((section) => (
            <ServiceSectionCard
              key={section.id}
              section={section}
              onUpdateSection={updateSectionField}
              onUpdateServiceDay={updateServiceDay}
            />
          ))}



        <Modal
          visible={showAddSectionModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddSectionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Choisir une rubrique</Text>

              {ARTICLE_LABELS.map((label) => (
                <TouchableOpacity
                  key={label}
                  onPress={() => {
                    addArticleSection(label);
                    setShowAddSectionModal(false);
                  }}
                  style={styles.modalOption}
                >
                  <Text style={styles.modalOptionText}>{label}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setShowAddSectionModal(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Text style={styles.label}>Remise</Text>
        <TextInput
          value={discountAmount}
          onChangeText={setDiscountAmount}
          keyboardType="numeric"
          placeholder="0"
          style={styles.input}
        />
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>📊 Récapitulatif global</Text>

          <Text style={styles.globalText}>
            CA : {totals.subtotal.toFixed(2)} $
          </Text>

          <Text style={styles.globalText}>
            Remise : {discount.toFixed(2)} $
          </Text>

          <Text style={styles.globalText}>
            Total net : {grandTotal.toFixed(2)} $
          </Text>

          <Text style={styles.globalText}>
            Coût total : {totals.totalCost.toFixed(2)} $
          </Text>

          <Text style={styles.globalText}>
            Marge : {finalMargin.toFixed(2)} $
          </Text>
        </View>
        {formError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}



        <TouchableOpacity
          onPress={() => {
            handleSubmit();
          }}
          activeOpacity={0.8}
          style={[styles.saveButton, saving && styles.disabledButton]}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Enregistrement..." : submitLabel}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({


  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    color: "#0F172A",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 5,
  },

  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 12,
    color: "#0F172A",
  },

  addMainButton: {
    backgroundColor: "#0F766E",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#115E59",
  },

  addMainButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  summaryCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },

  globalText: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    color: "#064E3B",
  },

  saveButton: {
    backgroundColor: "#D97706",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  datePickerButton: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 12,
  },

  datePickerText: {
    color: "#0F172A",
    fontSize: 14,
  },

  datePickerPlaceholder: {
    color: "#94A3B8",
  },

  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 14,
    color: "#0F172A",
  },

  modalOption: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  modalOptionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  modalCancelButton: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  modalCancelText: {
    color: "#B91C1C",
    fontWeight: "800",
  },

  content: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    padding: 16,
  },


  center: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 420,
    alignItems: "center",
  },

  loadingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },


  textArea: {
    minHeight: 90,
  },


  disabledButton: {
    opacity: 0.6,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  errorText: {
    color: "#B91C1C",
    fontWeight: "700",
    fontSize: 13,
  },

});