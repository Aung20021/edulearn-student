// /pages/api/prices.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export default async function handler(req, res) {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
    });

    const formatted = prices.data.map((price) => ({
      id: price.id,
      name: price.product.name,
      amount: (price.unit_amount || 0) / 100,
      currency: price.currency.toUpperCase(),
      interval: price.recurring?.interval,
    }));

    res.status(200).json({ prices: formatted });
  } catch (err) {
    console.error("Error fetching Stripe prices:", err);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
}
