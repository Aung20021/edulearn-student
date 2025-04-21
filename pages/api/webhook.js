import Stripe from "stripe";
import { buffer } from "micro";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    const userId = session.metadata?.userId;

    try {
      await mongooseConnect();

      if (!userId) {
        console.error("❌ No userId in session metadata");
        return res.status(400).json({ error: "Missing userId in metadata" });
      }

      // 🔄 Get subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const recurring = subscription.items.data[0].price.recurring;
      const interval = recurring.interval; // e.g., "month"
      const intervalCount = recurring.interval_count; // e.g., 1, 3, 6

      const mappedInterval = `${intervalCount}m`;

      // 📅 Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + intervalCount);

      // 👇 Construct subscription object
      const subscriptionData = {
        isActive: true,
        interval: mappedInterval,
        startDate,
        endDate,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      };

      // 🔍 Log the subscription data before saving
      console.log("📦 Subscription data to be saved:", subscriptionData);

      // 💾 Save to user document
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { subscription: subscriptionData } },
        { new: true }
      );
      console.log("📄 Updated User:", updatedUser);

      if (!updatedUser) {
        console.warn(`⚠️ No user found with ID ${userId}`);
      } else {
        console.log(
          `✅ Subscription activated for user ${updatedUser.email} (${mappedInterval})`
        );
      }
    } catch (err) {
      console.error("🔥 Error processing Stripe webhook:", err);
      return res.status(500).send("Internal server error");
    }
  }

  return res.status(200).json({ received: true });
}
