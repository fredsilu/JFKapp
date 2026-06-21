//app/(traiteur)/config/company-settings.tsx
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
  getCompanySettings,
  updateCompanySettings,
  DocumentCurrency,
} from "@/src/services/companySettings.service";

export default function CompanySettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [rccm, setRccm] = useState("");
  const [idNat, setIdNat] = useState("");
  const [nif, setNif] = useState("");

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [currency, setCurrency] = useState("USD");

  const [defaultDocumentCurrency, setDefaultDocumentCurrency] =
    useState<DocumentCurrency>("USD");

  const [usdToCdfRate, setUsdToCdfRate] = useState("2850");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const settings = await getCompanySettings();

      setCompanyName(settings.companyName);
      setPhone(settings.phone);
      setEmail(settings.email);
      setAddress(settings.address);

      setRccm(settings.rccm);
      setIdNat(settings.idNat);
      setNif(settings.nif);

      setDefaultDocumentCurrency(settings.defaultDocumentCurrency);
      setUsdToCdfRate(String(settings.usdToCdfRate ?? 2850));

      const account = settings.bankAccounts?.[0];

      if (account) {
        setBankName(account.bankName);
        setAccountNumber(account.accountNumber);
        setCurrency(account.currency);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de charger les paramètres.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    const rate = Number(usdToCdfRate);

    if (!Number.isFinite(rate) || rate <= 0) {
      Alert.alert("Erreur", "Le taux USD vers CDF doit être supérieur à 0.");
      return;
    }

    try {
      setSaving(true);

      await updateCompanySettings({
        companyName,
        phone,
        email,
        address,

        rccm,
        idNat,
        nif,

        baseCurrency: "USD",
        defaultDocumentCurrency,
        usdToCdfRate: rate,

        bankAccounts: [
          {
            bankName,
            accountNumber,
            currency,
            isDefault: true,
          },
        ],
      });

      Alert.alert("Succès", "Paramètres enregistrés.");
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={titleStyle}>Société & Banque</Text>

      <Text>Nom société</Text>
      <TextInput value={companyName} onChangeText={setCompanyName} style={inputStyle} />

      <Text>Téléphone</Text>
      <TextInput value={phone} onChangeText={setPhone} style={inputStyle} />

      <Text>Email</Text>
      <TextInput value={email} onChangeText={setEmail} style={inputStyle} />

      <Text>Adresse</Text>
      <TextInput value={address} onChangeText={setAddress} style={inputStyle} />

      <Text>RCCM</Text>
      <TextInput value={rccm} onChangeText={setRccm} style={inputStyle} />

      <Text>ID Nat</Text>
      <TextInput value={idNat} onChangeText={setIdNat} style={inputStyle} />

      <Text>NIF</Text>
      <TextInput value={nif} onChangeText={setNif} style={inputStyle} />

      <Text style={sectionTitleStyle}>Multi-devise</Text>

      <Text>Devise document par défaut</Text>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => setDefaultDocumentCurrency("USD")}
          style={[
            currencyButtonStyle,
            defaultDocumentCurrency === "USD" && activeCurrencyButtonStyle,
          ]}
        >
          <Text
            style={[
              currencyButtonTextStyle,
              defaultDocumentCurrency === "USD" && activeCurrencyButtonTextStyle,
            ]}
          >
            USD
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setDefaultDocumentCurrency("CDF")}
          style={[
            currencyButtonStyle,
            defaultDocumentCurrency === "CDF" && activeCurrencyButtonStyle,
          ]}
        >
          <Text
            style={[
              currencyButtonTextStyle,
              defaultDocumentCurrency === "CDF" && activeCurrencyButtonTextStyle,
            ]}
          >
            CDF
          </Text>
        </TouchableOpacity>
      </View>

      <Text>Taux USD vers CDF</Text>
      <TextInput
        value={usdToCdfRate}
        onChangeText={setUsdToCdfRate}
        keyboardType="numeric"
        placeholder="Ex: 2850"
        style={inputStyle}
      />

      <Text style={{ color: "#6B7280", marginBottom: 12 }}>
        Exemple : 1 USD = {usdToCdfRate || "0"} CDF
      </Text>

      <Text style={sectionTitleStyle}>Compte bancaire</Text>

      <Text>Banque</Text>
      <TextInput value={bankName} onChangeText={setBankName} style={inputStyle} />

      <Text>Numéro de compte</Text>
      <TextInput
        value={accountNumber}
        onChangeText={setAccountNumber}
        style={inputStyle}
      />

      <Text>Devise du compte</Text>
      <TextInput value={currency} onChangeText={setCurrency} style={inputStyle} />

      <TouchableOpacity
        onPress={save}
        disabled={saving}
        style={saveButtonStyle}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const titleStyle = {
  fontSize: 24,
  fontWeight: "800" as const,
  marginBottom: 20,
};

const sectionTitleStyle = {
  fontSize: 18,
  fontWeight: "700" as const,
  marginTop: 20,
  marginBottom: 12,
};

const inputStyle = {
  borderWidth: 1,
  borderColor: "#D1D5DB",
  padding: 12,
  borderRadius: 8,
  marginTop: 4,
  marginBottom: 12,
};

const currencyButtonStyle = {
  flex: 1,
  padding: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#D1D5DB",
  alignItems: "center" as const,
  backgroundColor: "#fff",
};

const activeCurrencyButtonStyle = {
  backgroundColor: "#111827",
  borderColor: "#111827",
};

const currencyButtonTextStyle = {
  fontWeight: "800" as const,
  color: "#111827",
};

const activeCurrencyButtonTextStyle = {
  color: "#fff",
};

const saveButtonStyle = {
  marginTop: 20,
  marginBottom: 40,
  backgroundColor: "#111",
  padding: 16,
  borderRadius: 10,
  alignItems: "center" as const,
};