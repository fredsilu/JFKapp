// src/pdf/buildOperationalOrderHTML.ts

type BuildOperationalOrderHTMLParams = {
  order: any;
};

const formatText = (value: any) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
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
    quantity: number
  ) => {
    const key = id || `${name}-${unit}`;

    if (!map.has(key)) {
      map.set(key, {
        id,
        name,
        unit,
        quantity: 0,
      });
    }

    const existing = map.get(key);
    existing.quantity = Number((existing.quantity + quantity).toFixed(2));
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
            ingredientQuantityPerDish * dishQuantity
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
      Number(item.quantity || 0)
    );
  });

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};

export function buildOperationalOrderHTML({
  order,
}: BuildOperationalOrderHTMLParams) {
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

  const items = getOrderItems(order);
  const additionalIngredients = getAdditionalIngredients(order);
  const consolidatedIngredients = getConsolidatedIngredients(order);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Fiche opérationnelle ${orderNumber}</title>

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
      border-bottom: 3px solid #2563EB;
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
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      color: #1E3A8A;
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

    .qty {
      text-align: right;
      font-weight: 800;
      white-space: nowrap;
    }

    .comment {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 8px;
      padding: 10px;
      color: #92400E;
      font-weight: 700;
    }

    .checklist li {
      margin-bottom: 6px;
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
    <h1 class="title">Fiche opérationnelle</h1>
    <div class="subtitle">Commande : ${formatText(orderNumber)}</div>
  </div>

  <div class="notice">
    Document réservé aux équipes cuisine, logistique et terrain. Aucun prix, coût, marge ou ratio financier n’est affiché.
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
    additionalIngredients.length > 0
      ? `
      <div class="section">
        <div class="section-title">Ingrédients supplémentaires</div>
        <table>
          <thead>
            <tr>
              <th>Ingrédient</th>
              <th>Quantité</th>
            </tr>
          </thead>
          <tbody>
            ${additionalIngredients
              .map((item: any) => {
                const name =
                  item?.name ||
                  item?.ingredient?.name ||
                  'Ingrédient';

                const quantity = item?.quantity || 0;

                const unit =
                  item?.unit ||
                  item?.ingredient?.unit ||
                  '';

                return `
                  <tr>
                    <td><strong>${formatText(name)}</strong></td>
                    <td class="qty">${formatText(quantity)} ${formatText(unit)}</td>
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
    consolidatedIngredients.length > 0
      ? `
      <div class="section">
        <div class="section-title">Liste consolidée des ingrédients</div>
        <table>
          <thead>
            <tr>
              <th>Ingrédient</th>
              <th>Quantité totale</th>
            </tr>
          </thead>
          <tbody>
            ${consolidatedIngredients
              .map((item: any) => {
                return `
                  <tr>
                    <td><strong>${formatText(item.name)}</strong></td>
                    <td class="qty">${formatText(item.quantity)} ${formatText(item.unit)}</td>
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
    <div class="section-title">Instructions équipe</div>
    <ul class="checklist">
      <li>Vérifier les quantités avant préparation.</li>
      <li>Confirmer le lieu et l’heure de livraison.</li>
      <li>Préparer les emballages / contenants nécessaires.</li>
      <li>Informer le responsable en cas d’écart ou de rupture.</li>
    </ul>
  </div>

  <div class="footer">
    Fiche générée par JFKApp / Crepolia — document opérationnel interne.
  </div>
</body>
</html>
`;
}