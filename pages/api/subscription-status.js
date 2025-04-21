// pages/api/subscription-status.js
import { getServerSession } from "next-auth";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET method allowed" });
  }

  const session = await getServerSession(req, res);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await mongooseConnect();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = new Date();
    const isActive =
      user.subscription?.isActive &&
      user.subscription?.endDate &&
      now <= new Date(user.subscription.endDate);

    return res.status(200).json({
      isActive,
      subscription: user.subscription, // Return full subscription object for debugging
    });
  } catch (error) {
    console.error("Subscription Status Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
