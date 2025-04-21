import { getServerSession } from "next-auth";
import Stripe from "stripe";
import NextAuth from "@/pages/api/auth/[...nextauth]";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, NextAuth);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { priceId } = req.body;

  if (!priceId) {
    return res.status(400).json({ error: "Missing priceId" });
  }

  try {
    // Connect to DB to find user ID
    await mongooseConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create checkout session with userId in metadata
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        userId: user._id.toString(), // ✅ Pass userId to webhook
      },
      success_url: `${process.env.NEXTAUTH_URL}/success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscribe`,
    });

    return res.status(200).json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    return res.status(500).json({ error: "Stripe checkout session failed" });
  }
}
