/**
 * Функция для расчета выручки
 * @param purchase запись о покупке (purchase_records)
 * @param _product карточка товара (products)
 * @returns {number}
 */

// @TODO: Расчет выручки с учетом скидки
// purchase — это один чек в data.purchase_records
// _product — это продукт из data.product
function calculateSimpleRevenue(purchase, _product) {
  return (
 // item.sale_price * item.quantity...  
    purchase.sale_price * purchase.quantity * (1 - purchase.discount / 100)
  );
  // discount = (1 - purchase.discount) / 100; //1-discount = процент который получили за товар от его изначальной 100% стоимости
  // return sale_price * quantity * discount; //возвращаем чистую выручку от продажи (цена товара sale_price * кол-во товара quantity * процент, который получен от стоимости товара с учетом его скидки)
}

/**
 * Функция для расчета бонусов (для продавца)
 * логика: 
 *  15% — для продавца, который принёс наибольшую прибыль.
    10% — для продавцов, которые по прибыли находятся на втором и третьем месте.
    5% — для всех остальных продавцов, кроме самого последнего.
    0% — для продавца на последнем месте.
 * @param index порядковый номер в отсортированном массиве (позицию продавца в рейтинге)
 * @param total общее число продавцов (сколько всего продавцов в рейтинге)
 * @param seller карточка продавца (данные о продажах каждого продавца)
 * @returns {number}
 */

// @TODO: Расчет бонуса от позиции в рейтинге
function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;
  if (index === 0) {
    //o это 1 в js 1 место
    return seller.profit * 0.15; //15% — для продавца, который принёс наибольшую прибыль
  } else if (index === 1 || index === 2) {
    //2 и 3 место
    return seller.profit * 0.1; //10% — для продавцов, которые по прибыли находятся на втором и третьем месте
  } else if (index === total - 1) {
    //последнее место
    return 0; //0% — для продавца на последнем месте
  } else {
    return seller.profit * 0.05; //5% — для всех остальных продавцов, кроме самого последнего
  }
}

/**
 * Функция для анализа данных продаж
 * @param data // передаем имеющиеся данные
 * @param options // передаем две функции calculateRevenue, calculateBonus в виде объекта
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
// @TODO: Проверка входных данных
function analyzeSalesData(data, options) {
  //проверяем является ли переданное значение массивом Array.isArray
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records) ||
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций
  const { calculateRevenue, calculateBonus } = options; //передаем две функции calculateRevenue, calculateBonus в виде объекта
  if (!calculateRevenue || !calculateBonus) {
    throw new Error("Не переданы функции для расчетов");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {}, //количество всех проданных товаров:ключ объекта — артикул товара; значение — количество, которое будет увеличиваться по мере обработки записей о продажах
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  //map() перебирает каждый товар и преобразует его в пару [ключ seller.id, значение полный объект seller] - создаем нужный массив
  //Object.fromEntries собирает все пары в один объект
  const sellerIndex = Object.fromEntries(
    sellerStats.map((seller) => [seller.id, seller]), //seller_1: {id: 'seller_1', name: 'Alexey Petrov', revenue: 0, profit: 0, sales_count: 0, …}...
  );
  const productIndex = Object.fromEntries(
    data.products.map((product) => [product.sku, product]),
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца
  //перебираем каждый чек record в data.purchase_records
  data.purchase_records.forEach((record) => { //record это carrentvalue в foreach т.е. в массиве purchase_records
    const seller = sellerIndex[record.seller_id]; // продавец в sellerIndex по seller_id из текущего чека
    if (!seller) return;
    seller.sales_count += 1; // каждый раз, когда чек принадлежит какому‑то продавцу, его личный счётчик sales_count увеличивается на единицу

    // Расчёт прибыли для каждого товара
    record.items.forEach((item) => { // item это один из элементов массива item внутри чека(purchase_records)
      const product = productIndex[item.sku]; // Товар
      if (!product) return;

      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const cost = product.purchase_price * item.quantity;
      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      const revenue = calculateRevenue(item, product);
      // Посчитать прибыль: выручка минус себестоимость
      const profit = revenue - cost;

      // Увеличить общую накопленную прибыль (profit) у продавца
      seller.revenue = +(seller.revenue + revenue).toFixed(2); 
      seller.profit += profit;

      // Учёт количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      // По артикулу товара увеличить его проданное количество у продавца
      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  // Формирование топ-10 товаров
  // Расчет бонусов и формирование топ-10 товаров
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);
    // Формирование топ-10 товаров
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id, // Строка, идентификатор продавца
    name: seller.name, // Строка, имя продавца
    revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
    profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
    sales_count: seller.sales_count, // Целое число, количество продаж продавца
    top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
    bonus: +seller.bonus.toFixed(2), // Число с двумя знаками после точки, бонус продавца
  }));
}