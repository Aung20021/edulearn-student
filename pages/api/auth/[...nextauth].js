import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import client from "@/lib/mongodb";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import User from "@/models/User"; // Import User model
import { mongooseConnect } from "@/lib/mongoose"; // Ensure MongoDB is connected

export default NextAuth({
  adapter: MongoDBAdapter(client),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "jwt", // Explicitly defining JWT as session strategy
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user._id;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      // Ensure MongoDB connection
      await mongooseConnect();

      // Check if the user already exists in the database
      const existingUser = await User.findOne({ email: user.email });

      if (!existingUser) {
        // If the user doesn't exist, create a new user with the "teacher" role
        // Leave the 'name' as an empty string if not provided
        const userName = user.name || user.email; // Default value is an empty string if 'name' is not available
        await User.create({
          name: userName, // Set the 'name' field
          email: user.email,
          role: "student", // Ensure the role is set as teacher
          provider: account.provider, // Set the provider (google/email)
          image: user.image || "", // Use an empty string if image is unavailable
        });
      } else {
        // If the user exists, ensure their role is "teacher"
        if (existingUser.role !== "student") {
          await User.updateOne(
            { email: user.email },
            { role: "student" } // Update to ensure the role is set as teacher
          );
        }
      }

      return true; // Allow the sign-in process to continue
    },

    async session({ session, token }) {
      // Step 1: Attach token ID if available (from the first callback)
      if (token?.id) {
        session.user._id = token.id;
      }

      // Step 2: Ensure MongoDB connection
      await mongooseConnect();

      // Step 3: Fetch user from the database using email
      const user = await User.findOne({ email: session.user.email });

      if (user) {
        session.user.id = user._id.toString(); // Add id from DB
        session.user.role = user.role; // Add role from DB
      }

      // Step 4: Return the updated session object
      return session;
    },
  },
});
