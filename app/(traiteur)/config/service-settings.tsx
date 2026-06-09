import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";

import {
    getCateringServiceSettings,
    updateCateringServiceSettings,
} from "@/src/services/cateringServiceSettings.service";

export default function ServiceSettingsScreen() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [serverDailyCost, setServerDailyCost] = useState("0");
    const [cookDailyCost, setCookDailyCost] = useState("0");

    const [defaultServerRate, setDefaultServerRate] = useState("25");
    const [defaultCookRate, setDefaultCookRate] = useState("50");

    const [electricityDailyCost, setElectricityDailyCost] = useState("0");
    const [gasDailyCost, setGasDailyCost] = useState("0");
    const [fuelDailyCost, setFuelDailyCost] = useState("0");

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            setLoading(true);

            const settings = await getCateringServiceSettings();

            setServerDailyCost(
                String(settings.serverDailyCost ?? 0)
            );

            setCookDailyCost(
                String(settings.cookDailyCost ?? 0)
            );

            setDefaultServerRate(
                String(settings.defaultServerRate ?? 25)
            );

            setDefaultCookRate(
                String(settings.defaultCookRate ?? 50)
            );

            setElectricityDailyCost(
                String(settings.electricityDailyCost ?? 0)
            );

            setGasDailyCost(
                String(settings.gasDailyCost ?? 0)
            );

            setFuelDailyCost(
                String(settings.fuelDailyCost ?? 0)
            );
        } catch (error) {
            console.error(error);

            Alert.alert(
                "Erreur",
                "Impossible de charger les paramètres."
            );
        } finally {
            setLoading(false);
        }
    }

    async function save() {
        try {
            setSaving(true);

            await updateCateringServiceSettings({
                serverDailyCost:
                    Number(serverDailyCost) || 0,

                cookDailyCost:
                    Number(cookDailyCost) || 0,

                defaultServerRate:
                    Number(defaultServerRate) || 25,

                defaultCookRate:
                    Number(defaultCookRate) || 50,

                electricityDailyCost:
                    Number(electricityDailyCost) || 0,

                gasDailyCost:
                    Number(gasDailyCost) || 0,

                fuelDailyCost:
                    Number(fuelDailyCost) || 0,
            });

            Alert.alert(
                "Succès",
                "Paramètres enregistrés."
            );
        } catch (error) {
            console.error(error);

            Alert.alert(
                "Erreur",
                "Impossible d'enregistrer."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <ScrollView
            style={{
                flex: 1,
                padding: 16,
            }}
        >
            <Text
                style={{
                    fontSize: 24,
                    fontWeight: "800",
                    marginBottom: 20,
                }}
            >
                Service traiteur
            </Text>

            <Text>Ratio serveur</Text>
            <TextInput
                value={defaultServerRate}
                onChangeText={setDefaultServerRate}
                keyboardType="numeric"
                style={inputStyle}
            />

            <Text>Ratio cuisinier</Text>
            <TextInput
                value={defaultCookRate}
                onChangeText={setDefaultCookRate}
                keyboardType="numeric"
                style={inputStyle}
            />

            <Text>Coût serveur / jour</Text>
            <TextInput
                value={serverDailyCost}
                onChangeText={setServerDailyCost}
                keyboardType="numeric"
                style={inputStyle}
            />

            <Text>Coût cuisinier / jour</Text>
            <TextInput
                value={cookDailyCost}
                onChangeText={setCookDailyCost}
                keyboardType="numeric"
                style={inputStyle}
            />

            <Text>Electricité / jour</Text>
            <TextInput
                value={electricityDailyCost}
                onChangeText={setElectricityDailyCost}
                keyboardType="numeric"
                style={inputStyle}
            />

            <Text>Gaz / jour</Text>
            <TextInput
                value={gasDailyCost}
                onChangeText={setGasDailyCost}
                keyboardType="numeric"
                style={inputStyle}
            />

            <Text>Carburant / jour</Text>
            <TextInput
                value={fuelDailyCost}
                onChangeText={setFuelDailyCost}
                keyboardType="numeric"
                style={inputStyle}
            />

            <TouchableOpacity
                onPress={save}
                disabled={saving}
                style={{
                    marginTop: 20,
                    marginBottom: 40,
                    backgroundColor: "#111",
                    padding: 16,
                    borderRadius: 10,
                    alignItems: "center",
                }}
            >
                <Text
                    style={{
                        color: "#fff",
                        fontWeight: "700",
                    }}
                >
                    {saving
                        ? "Enregistrement..."
                        : "Enregistrer"}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const inputStyle = {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 12,
};