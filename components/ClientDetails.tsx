import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { Client } from '@/types';
import { useOrders } from '@/src/hooks/useFirestore';
import { updateClient } from '@/src/services/firestore';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import ErrorMessage from '@/src/components/ErrorMessage';
import Modal from '@/components/Modal';
import ClientForm from '@/components/ClientForm';

interface ClientDetailsProps {
  clientId: string;
  clients: Client[];
  onClose: () => void;
  onOpenOrder?: (orderId: string) => void;
}

export default function ClientDetails({
  clientId,
  clients,
  onClose,
  onOpenOrder,
}: ClientDetailsProps) {
  const [showEditForm, setShowEditForm] = useState(false);

  const client = useMemo(() => {
    return clients.find(c => c.id === clientId);
  }, [clients, clientId]);

  const safeClientId = client?.id || '__missing_client__';

  const {
    data: rawOrders = [],
    loading,
    error,
  } = useOrders({
    where: ['clientId', '==', safeClientId],
  });

  const clientOrders = useMemo(() => {
    return [...rawOrders].sort((a, b) => {
      const aTime = getDateTime(a.createdAt);
      const bTime = getDateTime(b.createdAt);
      return bTime - aTime;
    });
  }, [rawOrders]);

  const handleUpdateClient = async (updatedData: Partial<Client>) => {
    if (!client?.id) return;

    try {
      await updateClient(client.id, updatedData);
      setShowEditForm(false);
    } catch (err) {
      console.error(err);
      Alert.alert(
        'Erreur',
        'Impossible de modifier les informations du client.'
      );
    }
  };

  const handleOpenOrder = (orderId?: string) => {
    if (!orderId) {
      Alert.alert('Erreur', 'Impossible d’ouvrir cette commande.');
      return;
    }

    if (!onOpenOrder) {
      Alert.alert(
        'Information',
        'Le détail de commande n’est pas encore connecté à cette page.'
      );
      return;
    }

    onOpenOrder(orderId);
  };

  if (!client) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Client introuvable</Text>

          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={26} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.emptyState}>
          <Icon name="person-off" size={48} color="#9CA3AF" />
          <Text style={styles.empty}>
            Ce client n’existe pas ou a été supprimé.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Détails du client</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowEditForm(true)}>
            <Icon name="edit" size={22} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={26} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profil */}
        <View style={styles.profile}>
          <Image
            source={
              client.profilePicture
                ? { uri: client.profilePicture }
                : require('@/assets/images/no_client_picture.jpg')
            }
            style={styles.profileImage}
          />

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{client.name || 'Sans nom'}</Text>

            <Text style={styles.clientType}>
              {(client as any).type || 'Client'}
            </Text>
          </View>
        </View>

        {/* Informations générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations générales</Text>

          <InfoRow label="Nom" value={client.name} icon="person" />
          <InfoRow label="Téléphone" value={client.phone} icon="phone" />
          <InfoRow label="Email" value={client.email} icon="email" />
          <InfoRow label="Adresse" value={client.address} icon="location-on" />
          <InfoRow label="Ville" value={client.city} icon="location-city" />
        </View>

        {/* Informations légales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations légales</Text>

          <InfoRow label="RCCM" value={client.rccm} icon="badge" />
          <InfoRow label="IDNAT" value={client.idnat} icon="assignment-ind" />
          <InfoRow label="NIF" value={(client as any).nif} icon="receipt-long" />
        </View>

        {/* Autres informations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Autres informations</Text>

          <InfoRow
            label="Contact principal"
            value={(client as any).contactPerson}
            icon="contacts"
          />
          <InfoRow
            label="Fonction"
            value={(client as any).position}
            icon="work"
          />
          <InfoRow
            label="Notes"
            value={(client as any).notes}
            icon="notes"
            multiline
          />
        </View>

        {/* Historique commandes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des commandes</Text>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage message="Erreur lors du chargement des commandes" />
          ) : clientOrders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Icon name="inventory-2" size={36} color="#9CA3AF" />
              <Text style={styles.empty}>Aucune commande pour ce client</Text>
            </View>
          ) : (
            clientOrders.map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.85}
                onPress={() => handleOpenOrder(order.id)}
              >
                <View style={styles.orderHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${getStatusColor(order.status)}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(order.status) },
                      ]}
                    >
                      {order.status || 'Statut inconnu'}
                    </Text>
                  </View>

                  <View style={styles.amount}>
                    <Icon name="attach-money" size={16} color="#007AFF" />
                    <Text style={styles.amountText}>
                      {formatAmount(order.billedAmount)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.date}>
                  Créée le : {formatDate(order.createdAt)}
                </Text>

                <View style={styles.orderFooter}>
                  <Text style={styles.openDetailsText}>Voir les détails</Text>
                  <Icon name="chevron-right" size={22} color="#007AFF" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showEditForm}>
        <ClientForm
          client={client}
          onClose={() => setShowEditForm(false)}
          onSubmit={handleUpdateClient}
        />
      </Modal>
    </View>
  );
}

/* =======================
   COMPONENTS
======================= */

function InfoRow({
  label,
  value,
  icon,
  multiline = false,
}: {
  label: string;
  value?: string | number | null;
  icon: keyof typeof Icon.glyphMap;
  multiline?: boolean;
}) {
  const displayValue =
    value !== undefined && value !== null && String(value).trim() !== ''
      ? String(value)
      : 'Non renseigné';

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon name={icon} size={18} color="#007AFF" />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, multiline && styles.multiline]}>
          {displayValue}
        </Text>
      </View>
    </View>
  );
}

/* =======================
   HELPERS
======================= */

function getDateTime(value: any): number {
  if (!value) return 0;

  if (value?.toDate) {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  return new Date(value).getTime() || 0;
}

function formatDate(value: any): string {
  const time = getDateTime(value);

  if (!time) return '—';

  return new Date(time).toLocaleDateString('fr-FR');
}

function formatAmount(value: any): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return '—';
  }

  return Number(value).toFixed(2);
}

function getStatusColor(status?: string) {
  switch (status) {
    case 'En cours':
      return '#007AFF';
    case 'En préparation':
      return '#FF9500';
    case 'Livré':
      return '#34C759';
    case 'Annulé':
      return '#FF3B30';
    default:
      return '#6B7280';
  }
}

/* =======================
   STYLES
======================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  profile: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E5E7EB',
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },

  clientType: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },

  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    color: '#111827',
  },

  infoRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },

  multiline: {
    lineHeight: 21,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },

  emptyOrders: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },

  empty: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },

  orderCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  amount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },

  date: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },

  orderFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  openDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
});