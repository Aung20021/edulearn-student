// pages/api/unsubscribe.js
import { getServerSession } from "next-auth";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    await mongooseConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.subscription?.stripeSubscriptionId) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    console.log(
      "🧾 Stripe subscription ID:",
      user.subscription.stripeSubscriptionId
    );

    // Cancel the Stripe subscription
    const canceledSubscription = await stripe.subscriptions.cancel(
      user.subscription.stripeSubscriptionId
    );

    // Keep user active until endDate
    const newEndDate = new Date(canceledSubscription.current_period_end * 1000);

    // Only mark as inactive if the current date is past the endDate
    const isActive = new Date() <= newEndDate;

    // Update user's subscription status
    user.subscription = {
      ...user.subscription,
      isActive,
      endDate: newEndDate,
    };

    await user.save();

    return res.status(200).json({
      message:
        "Unsubscribed successfully. Access remains until the end of your billing cycle.",
      subscription: user.subscription,
    });
  } catch (err) {
    console.error("Error unsubscribing user:", err);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
}
