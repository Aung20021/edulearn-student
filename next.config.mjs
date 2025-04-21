/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Existing Google user images
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Add Cloudinary domain
      },
    ],
  },
};

export default nextConfig;
