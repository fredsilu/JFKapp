import React from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";

import {
    CateringSection,
    CateringServiceDay,
} from "@/types/catering";

import { formatCurrency } from "@/src/utils/costs";

type Props = {
    section: CateringSection;

    onUpdateSection: (
        sectionId: string,
        field: keyof CateringSection,
        value: any
    ) => void;

    onUpdateServiceDay: (
        sectionId: string,
        dayId: string,
        field: keyof CateringServiceDay,
        value: any
    ) => void;
};

export default function ServiceSectionCard({
    section,
    onUpdateSection,
    onUpdateServiceDay,
}: Props) {
    const serviceDays = section.serviceDays ?? [];

    return (
        <View
            style={{
                padding: 14,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 10,
                marginBottom: 12,
                backgroundColor: "#fff",
            }}
        >
            <Text
                style={{
                    fontSize: 18,
                    fontWeight: "700",
                }}
            >
                Service traiteur
            </Text>

            <TouchableOpacity
                onPress={() =>
                    onUpdateSection(
                        section.id,
                        "enabled",
                        !section.enabled
                    )
                }
                style={{
                    marginTop: 10,
                    marginBottom: 10,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: section.enabled
                        ? "#111"
                        : "#ddd",
                    alignItems: "center",
                }}
            >
                <Text
                    style={{
                        color: section.enabled
                            ? "#fff"
                            : "#111",
                    }}
                >
                    {section.enabled
                        ? "Service activé"
                        : "Activer service"}
                </Text>
            </TouchableOpacity>

            {!section.enabled && null}

            {section.enabled && (
                <>
                    <Text>Nombre de jours</Text>

                    <TextInput
                        value={String(section.numberOfDays ?? 1)}
                        onChangeText={(value) =>
                            onUpdateSection(
                                section.id,
                                "numberOfDays",
                                Number(value) || 1
                            )
                        }
                        keyboardType="numeric"
                        style={inputStyle}
                    />

                    <Text
                        style={{
                            marginTop: 10,
                            marginBottom: 10,
                            fontWeight: "700",
                        }}
                    >
                        Mode de service
                    </Text>

                    <TouchableOpacity
                        style={modeButton(
                            section.serviceMode ===
                            "identical_days"
                        )}
                        onPress={() =>
                            onUpdateSection(
                                section.id,
                                "serviceMode",
                                "identical_days"
                            )
                        }
                    >
                        <Text>
                            Services identiques
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={modeButton(
                            section.serviceMode ===
                            "different_days"
                        )}
                        onPress={() =>
                            onUpdateSection(
                                section.id,
                                "serviceMode",
                                "different_days"
                            )
                        }
                    >
                        <Text>
                            Services différents
                        </Text>
                    </TouchableOpacity>

                    {serviceDays.map((day) => (
                        <View
                            key={day.id}
                            style={{
                                marginTop: 12,
                                padding: 12,
                                borderWidth: 1,
                                borderColor: "#E5E7EB",
                                borderRadius: 8,
                            }}
                        >
                            <Text
                                style={{
                                    fontWeight: "700",
                                    marginBottom: 10,
                                }}
                            >
                                Jour {day.dayNumber}
                            </Text>

                            <Text>
                                Nombre de personnes
                            </Text>

                            <TextInput
                                value={String(
                                    day.numberOfPeople ?? 0
                                )}
                                onChangeText={(value) =>
                                    onUpdateServiceDay(
                                        section.id,
                                        day.id,
                                        "numberOfPeople",
                                        Number(value) || 0
                                    )
                                }
                                keyboardType="numeric"
                                style={inputStyle}
                            />

                            <Text>
                                Ratio serveur
                            </Text>

                            <TextInput
                                value={String(
                                    day.serverRate ?? 25
                                )}
                                onChangeText={(value) =>
                                    onUpdateServiceDay(
                                        section.id,
                                        day.id,
                                        "serverRate",
                                        Number(value) || 0
                                    )
                                }
                                keyboardType="numeric"
                                style={inputStyle}
                            />

                            <Text>
                                Ratio cuisinier
                            </Text>

                            <TextInput
                                value={String(
                                    day.cookRate ?? 50
                                )}
                                onChangeText={(value) =>
                                    onUpdateServiceDay(
                                        section.id,
                                        day.id,
                                        "cookRate",
                                        Number(value) || 0
                                    )
                                }
                                keyboardType="numeric"
                                style={inputStyle}
                            />


                            <Text>
                                Montant facturé
                            </Text>

                            <TextInput
                                value={String(
                                    day.billedAmount ?? 0
                                )}
                                onChangeText={(value) =>
                                    onUpdateServiceDay(
                                        section.id,
                                        day.id,
                                        "billedAmount",
                                        Number(value) || 0
                                    )
                                }
                                keyboardType="numeric"
                                style={inputStyle}
                            />

                            <View
                                style={{
                                    marginTop: 8,
                                    padding: 10,
                                    backgroundColor: "#F3F4F6",
                                    borderRadius: 8,
                                }}
                            >
                                <Text>
                                    Serveurs calculés :
                                    {" "}
                                    {day.numberOfServers}
                                </Text>

                                <Text>
                                    Cuisiniers calculés :
                                    {" "}
                                    {day.numberOfCooks}
                                </Text>

                                <Text>
                                    Coût serveur :
                                    {" "}
                                    {formatCurrency(
                                        day.numberOfServers *
                                        (day.serverDailyCost ?? 0)
                                    )}
                                </Text>

                                <Text>
                                    Coût cuisinier :
                                    {" "}
                                    {formatCurrency(
                                        day.numberOfCooks *
                                        (day.cookDailyCost ?? 0)
                                    )}
                                </Text>

                                <Text>
                                    Charges diverses :
                                    {" "}
                                    {formatCurrency(
                                        day.extraDailyCost ?? 0
                                    )}
                                </Text>

                                <Text
                                    style={{
                                        marginTop: 6,
                                        fontWeight: "700",
                                    }}
                                >
                                    Coût total :
                                    {" "}
                                    {formatCurrency(
                                        day.totalCost ?? 0
                                    )}
                                </Text>
                            </View>
                        </View>
                    ))}

                    <View
                        style={{
                            marginTop: 12,
                            padding: 10,
                            backgroundColor: "#F3F4F6",
                            borderRadius: 8,
                        }}
                    >
                        <Text>
                            Total service :
                            {" "}
                            {formatCurrency(
                                section.total ?? 0
                            )}
                        </Text>

                        <Text>
                            Coût :
                            {" "}
                            {formatCurrency(
                                section.costAmount ?? 0
                            )}
                        </Text>

                        <Text>
                            Marge :
                            {" "}
                            {formatCurrency(
                                section.margin ?? 0
                            )}
                        </Text>
                    </View>
                </>
            )}
        </View>
    );
}

function modeButton(
    active: boolean
) {
    return {
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: active
            ? "#111"
            : "#E5E7EB",
    };
}

const inputStyle = {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 8,
};