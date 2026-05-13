// src/pdf/buildOperationalManagementHTML.ts

type BuildOperationalManagementHTMLParams = {
  order: any;
};

const formatText = (value: any) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

const formatMoney = (value: any) => {
  return `${Number(value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} $`;
};

const getOrderItems = (order: any) => {
  if (Array.isArray(order?.operationalDishes) && order.operationalDishes.length > 0) {
    return order.operationalDishes;
  }

  if (Array.isArray(order?.items) && order.items.length > 0) {
    return order.items;
  }

  if (Array.isArray(order?.dishes) && order.dishes.length > 0) {
    return order.dishes;
  }

  return [];
};

const getAdditionalIngredients = (order: any) => {
  if (
    Array.isArray(order?.operationalAdditionalIngredients) &&
    order.operationalAdditionalIngredients.length > 0
  ) {
    return order.operationalAdditionalIngredients;
  }

  if (
    Array.isArray(order?.additionalIngredients) &&
    order.additionalIngredients.length > 0
  ) {
    return order.additionalIngredients;
  }

  return [];
};

const getConsolidatedIngredients = (order: any) => {
  const map = new Map<string, any>();
  const additionalIngredients = getAdditionalIngredients(order);

  const addIngredient = (
    id: string,
    name: string,
    unit: string,
    quantity: number,
    unitPrice: number = 0
  ) => {
    const key = id || `${name}-${unit}`;

    if (!map.has(key)) {
      map.set(key, {
        id,
        name,
        unit,
        quantity: 0,
        unitPrice,
        total: 0,
      });
    }

    const existing = map.get(key);

    existing.quantity = Number((existing.quantity + quantity).toFixed(2));
    existing.unitPrice = existing.unitPrice || unitPrice;
    existing.total = Number((existing.quantity * existing.unitPrice).toFixed(2));
  };

  if (Array.isArray(order?.operationalDishes)) {
    order.operationalDishes.forEach((dish: any) => {
      const dishQuantity = Number(dish.quantity || 0);

      if (Array.isArray(dish.ingredients)) {
        dish.ingredients.forEach((item: any) => {
          const ingredientQuantityPerDish = Number(item.quantity || 0);

          addIngredient(
            item.id || item.ingredientId || item.name,
            item.name || 'Ingrédient',
            item.unit || '',
            ingredientQuantityPerDish * dishQuantity,
            Number(item.unitPrice || item.price || 0)
          );
        });
      }
    });
  }

  additionalIngredients.forEach((item: any) => {
    addIngredient(
      item.id || item.ingredientId || item.ingredient?.id || item.name,
      item.name || item.ingredient?.name || 'Ingrédient',
      item.unit || item.ingredient?.unit || '',
      Number(item.quantity || 0),
      Number(item.unitPrice || item.price || item.ingredient?.price || 0)
    );
  });

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};

export function buildOperationalManagementHTML({
  order,
}: BuildOperationalManagementHTMLParams) {
  const orderNumber =
    order?.number ||
    order?.orderNumber ||
    'CMD-XXXX';

  const clientName =
    order?.client?.name ||
    order?.name ||
    'Client non défini';

  const deliveryDate =
    order?.deliveryDate ||
    order?.dateLivraison ||
    order?.eventDate ||
    '-';

  const deliveryTime =
    order?.deliveryTime ||
    order?.eventTime ||
    '-';

  const deliveryAddress =
    order?.deliveryAddress ||
    order?.address ||
    order?.eventLocation ||
    '-';

  const guestCount =
    order?.guestCount ||
    order?.numberOfGuests ||
    order?.peopleCount ||
    '-';

  const billedAmount =
    order?.billedAmount ||
    order?.totals?.subtotal ||
    order?.totals?.total ||
    0;

  const dishesCost =
    order?.operationalCosts?.dishesCost || 0;

  const additionalIngredientsCost =
    order?.operationalCosts?.additionalIngredientsCost || 0;

  const totalProductionCost =
    order?.operationalCosts?.totalProductionCost || 0;

  const productionCostRatio =
    billedAmount > 0 ? (totalProductionCost / billedAmount) * 100 : 0;

  const estimatedMargin =
    billedAmount - totalProductionCost;

  const estimatedMarginRatio =
    billedAmount > 0 ? (estimatedMargin / billedAmount) * 100 : 0;

  const ratioStatus =
    productionCostRatio < 35
      ? 'BON'
      : productionCostRatio <= 50
        ? 'ATTENTION'
        : 'DANGEREUX';

  const ratioColor =
    productionCostRatio < 35
      ? '#166534'
      : productionCostRatio <= 50
        ? '#92400E'
        : '#991B1B';

  const ratioBg =
    productionCostRatio < 35
      ? '#DCFCE7'
      : productionCostRatio <= 50
        ? '#FEF3C7'
        : '#FEE2E2';

  const items = getOrderItems(order);
  const additionalIngredients = getAdditionalIngredients(order);
  const consolidatedIngredients = getConsolidatedIngredients(order);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Fiche management ${orderNumber}</title>

  <style>
    @page {
      size: A4;
      margin: 24px;
    }

    body {
      font-family: Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.45;
    }

    .header {
      border-bottom: 3px solid #111827;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }

    .title {
      font-size: 24px;
      font-weight: 800;
      color: #111827;
      margin: 0;
      text-transform: uppercase;
    }

    .subtitle {
      margin-top: 4px;
      font-size: 13px;
      color: #4B5563;
      font-weight: 700;
    }

    .notice {
      background: #F9FAFB;
      border: 1px solid #D1D5DB;
      color: #374151;
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 14px;
      font-weight: 700;
    }

    .section {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 15px;
      font-weight: 800;
      margin-bottom: 8px;
      color: #111827;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 5px;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 14px;
    }

    .info-box {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 9px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-top: 8px;
    }

    .kpi {
      border-radius: 10px;
      padding: 12px;
      border: 1px solid #E5E7EB;
      background: #F9FAFB;
    }

    .kpi-dark {
      background: #111827;
      color: white;
    }

    .kpi-label {
      font-size: 11px;
      font-weight: 700;
      color: #6B7280;
      margin-bottom: 4px;
    }

    .kpi-dark .kpi-label {
      color: #D1D5DB;
    }

    .kpi-value {
      font-size: 16px;
      font-weight: 900;
      color: #111827;
    }

    .kpi-dark .kpi-value {
      color: #ffffff;
    }

    .ratio-box {
      margin-top: 10px;
      border-radius: 10px;
      padding: 12px;
      background: ${ratioBg};
      color: ${ratioColor};
      font-weight: 900;
      font-size: 14px;
    }

    .label {
      color: #6B7280;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 2px;
    }

    .value {
      color: #111827;
      font-size: 13px;
      font-weight: 800;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }

    th {
      background: #F3F4F6;
      color: #374151;
      font-size: 11px;
      text-align: left;
      padding: 8px;
      border: 1px solid #E5E7EB;
      text-transform: uppercase;
    }

    td {
      padding: 8px;
      border: 1px solid #E5E7EB;
      vertical-align: top;
    }

    .qty,
    .money {
      text-align: right;
      font-weight: 800;
      white-space: nowrap;
    }

    .money {
      color: #047857;
    }

    .comment {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 8px;
      padding: 10px;
      color: #92400E;
      font-weight: 700;
    }

    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #E5E7EB;
      font-size: 10px;
      color: #6B7280;
      text-align: center;
    }
  </style>
</head>

<body>
  <div class="header">
    <h1 class="title">Fiche management</h1>
    <div class="subtitle">Commande : ${formatText(orderNumber)}</div>
  </div>

  <div class="notice">
    Document réservé au management. Contient les coûts, prix et indicateurs internes de production.
  </div>

  <div class="section">
    <div class="section-title">Client / Événement</div>
    <div class="grid">
      <div class="info-box">
        <div class="label">Client</div>
        <div class="value">${formatText(clientName)}</div>
      </div>

      <div class="info-box">
        <div class="label">Événement</div>
        <div class="value">${formatText(order?.designation)}</div>
      </div>

      <div class="info-box">
        <div class="label">Date</div>
        <div class="value">${formatText(deliveryDate)}</div>
      </div>

      <div class="info-box">
        <div class="label">Heure</div>
        <div class="value">${formatText(deliveryTime)}</div>
      </div>

      <div class="info-box">
        <div class="label">Lieu</div>
        <div class="value">${formatText(deliveryAddress)}</div>
      </div>

      <div class="info-box">
        <div class="label">Convives</div>
        <div class="value">${formatText(guestCount)} personne(s)</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Synthèse financière interne</div>

    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-label">Montant facturé</div>
        <div class="kpi-value">${formatMoney(billedAmount)}</div>
      </div>

      <div class="kpi">
        <div class="kpi-label">Coût production</div>
        <div class="kpi-value">${formatMoney(totalProductionCost)}</div>
      </div>

      <div class="kpi kpi-dark">
        <div class="kpi-label">Marge estimée</div>
        <div class="kpi-value">${formatMoney(estimatedMargin)}</div>
      </div>
    </div>

    <div class="ratio-box">
      Taux coût production : ${productionCostRatio.toFixed(1)}% — ${ratioStatus}
      <br/>
      Marge estimée : ${estimatedMarginRatio.toFixed(1)}%
    </div>
  </div>

  ${
    order?.comment
      ? `
      <div class="section">
        <div class="section-title">Commentaire</div>
        <div class="comment">${formatText(order.comment)}</div>
      </div>
      `
      : ''
  }

  <div class="section">
    <div class="section-title">Éléments à préparer</div>
    ${
      items.length > 0
        ? `
        <table>
          <thead>
            <tr>
              <th>Élément</th>
              <th>Quantité</th>
              <th>Jours</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map((item: any) => {
                const label =
                  item?.dish?.name ||
                  item?.label ||
                  item?.name ||
                  'Élément';

                const quantity = item?.quantity || 0;
                const days = item?.numberOfDays || item?.days || '-';

                return `
                  <tr>
                    <td><strong>${formatText(label)}</strong></td>
                    <td class="qty">${formatText(quantity)}</td>
                    <td class="qty">${formatText(days)}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
        `
        : '<p>Aucun élément renseigné.</p>'
    }
  </div>

  ${
    consolidatedIngredients.length > 0
      ? `
      <div class="section">
        <div class="section-title">Liste consolidée des ingrédients avec coûts</div>
        <table>
          <thead>
            <tr>
              <th>Ingrédient</th>
              <th>Quantité totale</th>
              <th>Prix unitaire</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${consolidatedIngredients
              .map((item: any) => {
                return `
                  <tr>
                    <td><strong>${formatText(item.name)}</strong></td>
                    <td class="qty">${formatText(item.quantity)} ${formatText(item.unit)}</td>
                    <td class="money">${formatMoney(item.unitPrice)}</td>
                    <td class="money">${formatMoney(item.total)}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
      `
      : ''
  }

  ${
    additionalIngredients.length > 0
      ? `
      <div class="section">
        <div class="section-title">Ingrédients supplémentaires</div>
        <table>
          <thead>
            <tr>
              <th>Ingrédient</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${additionalIngredients
              .map((item: any) => {
                const name =
                  item?.name ||
                  item?.ingredient?.name ||
                  'Ingrédient';

                const quantity = Number(item?.quantity || 0);

                const unit =
                  item?.unit ||
                  item?.ingredient?.unit ||
                  '';

                const unitPrice = Number(
                  item?.unitPrice ||
                  item?.price ||
                  item?.ingredient?.price ||
                  0
                );

                const total = quantity * unitPrice;

                return `
                  <tr>
                    <td><strong>${formatText(name)}</strong></td>
                    <td class="qty">${formatText(quantity)} ${formatText(unit)}</td>
                    <td class="money">${formatMoney(unitPrice)}</td>
                    <td class="money">${formatMoney(total)}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
      `
      : ''
  }

  <div class="section">
    <div class="section-title">Détail des coûts opérationnels</div>
    <table>
      <tbody>
        <tr>
          <td><strong>Coût des plats</strong></td>
          <td class="money">${formatMoney(dishesCost)}</td>
        </tr>
        <tr>
          <td><strong>Ingrédients supplémentaires</strong></td>
          <td class="money">${formatMoney(additionalIngredientsCost)}</td>
        </tr>
        <tr>
          <td><strong>Total coût production</strong></td>
          <td class="money">${formatMoney(totalProductionCost)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    Fiche management générée par JFKApp / Crepolia — document interne confidentiel.
  </div>
</body>
</html>
`;
}