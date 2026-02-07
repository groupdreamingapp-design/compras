import db from '../lib/db';

/**
 * Scores and ranks suppliers for a specific ingredient.
 * @param {number} ingredientId - ID of the ingredient to quote.
 * @param {Array} quotes - Array of { supplierId, price, paymentDays }. 
 *                         If empty, it fetches default suppliers for the ingredient (simulated).
 * @param {number} monthlyInflation - Projected monthly inflation percentage (e.g., 5).
 * @returns {Promise<Array>} Ranked list of suppliers with scores.
 */
export async function scoreSuppliers(ingredientId, quotes = [], monthlyInflation = 5) {
    // 1. Fetch Supplier Data (Reliability/Rating)
    const suppliersStmt = db.prepare('SELECT * FROM Proveedores');
    // ASYNC CALL
    const allSuppliers = await suppliersStmt.all();

    const supplierMap = new Map(allSuppliers.map(s => [s.ID, s]));

    // 2. Normalize and Prepare Data
    // ... (Logic remains same, no more db calls) ...
    let activeQuotes = quotes;
    if (activeQuotes.length === 0) {
        // Generate mock quotes for the given ingredient
        activeQuotes = allSuppliers.map(s => {
            // Base price variation for demo
            const basePrice = 1000; // Arbitrary base
            const priceVariation = (Math.random() * 200) - 100; // +/- 100

            // Parse payment days from string '30 Dias'
            const paymentDays = parseInt((s.Condicion_Pago || '0').split(' ')[0]) || 0;

            return {
                supplierId: s.ID,
                price: basePrice + priceVariation,
                paymentDays: paymentDays
            };
        });
    }

    // Find Min and Max for normalization
    const minPrice = Math.min(...activeQuotes.map(q => q.price));

    // 3. Scoring Algorithm
    const scoredQuotes = activeQuotes.map(quote => {
        const supplier = supplierMap.get(quote.supplierId);
        if (!supplier) return null;

        // A. Price Score (50%) - Inverse: Lower price is better.
        const priceScore = (minPrice / quote.price) * 100;

        // B. Financial Score (30%) - Opportunity Cost
        const financialGainPercent = (quote.paymentDays / 30) * monthlyInflation;
        const financialScore = Math.min((quote.paymentDays / 60) * 100, 100);

        // C. Reliability Score (20%)
        const reliabilityScore = (supplier.Rating_Calidad / 5) * 100;

        // Weighted Final Score
        const finalScore = (priceScore * 0.50) + (financialScore * 0.30) + (reliabilityScore * 0.20);

        return {
            supplierName: supplier.Nombre,
            price: quote.price.toFixed(2),
            paymentDays: quote.paymentDays,
            rating: supplier.Rating_Calidad,
            scores: {
                price: priceScore.toFixed(1),
                financial: financialScore.toFixed(1),
                reliability: reliabilityScore.toFixed(1)
            },
            finalScore: finalScore.toFixed(1),
            recommendationType: priceScore > financialScore ? 'Mejor Precio' : 'Ventaja Financiera'
        };
    });

    // Sort by Final Score Descending
    return scoredQuotes.sort((a, b) => b.finalScore - a.finalScore);
}
