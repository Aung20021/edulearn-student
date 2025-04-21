import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function Header() {
  const router = useRouter();
  const { pathname } = router;
  const { data: session } = useSession();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null); // 👈 fetched from DB

  const toggleMobileNav = () => setIsMobileNavOpen(!isMobileNavOpen);

  const active =
    "text-white bg-green-600 px-4 py-2 rounded-lg transition hover:bg-green-500 shadow-md";
  const inactive =
    "text-gray-500 transition hover:text-green-600 px-4 py-2 rounded-lg";

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/user?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) {
            setUserProfile(data.user); // 👈 Set fetched user data
          }
        })
        .catch((err) => console.error("Error fetching user profile:", err));
    }
  }, [session]);

  if (session) {
    return (
      <header className="bg-gradient-to-r from-white to-gray-100 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <span className="text-2xl font-semibold text-green-600 flex items-center gap-4">
              <h1
                className="font-bold bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(270deg, #10B981, #3B82F6)",
                  backgroundSize: "400% 400%",
                  animation: "gradientShift 4s ease infinite",
                }}
              >
                EduLearn
              </h1>

              <style jsx>{`
                @keyframes gradientShift {
                  0% {
                    background-position: 0% 50%;
                  }
                  50% {
                    background-position: 100% 50%;
                  }
                  100% {
                    background-position: 0% 50%;
                  }
                }
              `}</style>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link className={pathname === "/" ? active : inactive} href="/">
              Dashboard
            </Link>
            <Link
              className={pathname === "/courses" ? active : inactive}
              href="/courses"
            >
              Courses
            </Link>
            <Link
              className={pathname === "/archived" ? active : inactive}
              href="/archived"
            >
              Archived
            </Link>
            <Link
              className={pathname === "/subscribe" ? active : inactive}
              href="/subscribe"
            >
              Pricing
            </Link>
            <Link
              className={pathname === "/enrolled-courses" ? active : inactive}
              href="/enrolled-courses"
            >
              My Courses
            </Link>

            <Link
              className={pathname === "/settings" ? active : inactive}
              href="/settings"
            >
              Settings
            </Link>
          </nav>

          {/* Profile & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Profile Image from DB */}
            <Link className="relative" href="/settings">
              {userProfile?.image ? (
                <Image
                  className="w-10 h-10 rounded-full border border-gray-300"
                  src={userProfile.image}
                  alt={userProfile.name || session.user.email}
                  width={40}
                  height={40}
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-10 h-10 rounded-full border border-gray-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              )}
            </Link>

            {/* Mobile Nav Toggle */}
            <button
              onClick={toggleMobileNav}
              className="md:hidden p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
            >
              {isMobileNavOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  fill="none"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  fill="none"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileNavOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white shadow-md p-6">
            <nav className="flex flex-col space-y-4">
              <Link
                onClick={toggleMobileNav}
                className={pathname === "/" ? active : inactive}
                href="/"
              >
                Dashboard
              </Link>
              <Link
                onClick={toggleMobileNav}
                className={pathname === "/courses" ? active : inactive}
                href="/courses"
              >
                Courses
              </Link>
              <Link
                onClick={toggleMobileNav}
                className={pathname === "/archived" ? active : inactive}
                href="/archived"
              >
                Archived
              </Link>
              <Link
                onClick={toggleMobileNav}
                className={pathname === "/settings" ? active : inactive}
                href="/settings"
              >
                Settings
              </Link>
            </nav>
          </div>
        )}
      </header>
    );
  }

  return null;
}
