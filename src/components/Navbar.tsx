import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { motion } from "motion/react";
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard, 
  Sparkles,
  BookOpen,
  ShoppingBag
} from "lucide-react";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  // Derive currentPage from active router location path
  let currentPage = "home";
  if (path.startsWith("/course/")) {
    currentPage = "course-details";
  } else if (path.startsWith("/blog/")) {
    const slug = path.split("/blog/")[1];
    if (slug) {
      currentPage = "blog-details";
    } else {
      currentPage = "blog";
    }
  } else if (path.startsWith("/student/")) {
    currentPage = "student-portfolio";
  } else if (path === "/courses" || path === "/courses/") {
    currentPage = "courses";
  } else if (path === "/blogs" || path === "/blogs/" || path === "/blog" || path === "/blog/") {
    currentPage = "blog";
  } else if (path === "/about" || path === "/about/") {
    currentPage = "about";
  } else if (path === "/contact" || path === "/contact/") {
    currentPage = "contact";
  } else if (path === "/terms" || path === "/terms/") {
    currentPage = "terms";
  } else if (path === "/privacy" || path === "/privacy/") {
    currentPage = "privacy";
  } else if (path === "/refund-policy" || path === "/refund-policy/") {
    currentPage = "refund-policy";
  } else if (path === "/affiliate" || path === "/affiliate/") {
    currentPage = "affiliate";
  } else if (path === "/cart" || path === "/cart/") {
    currentPage = "cart";
  } else if (path === "/thank-you" || path === "/thank-you/") {
    currentPage = "thank-you";
  } else if (path === "/my-enrollments" || path === "/my-enrollments/") {
    currentPage = "my-enrollments";
  } else if (path === "/admin-login" || path === "/admin-login/") {
    currentPage = "admin-login";
  } else if (path === "/admin-dashboard" || path === "/admin-dashboard/") {
    currentPage = "admin-dashboard";
  } else if (path === "/onboarding" || path === "/onboarding/") {
    currentPage = "onboarding";
  } else if (path === "/student-portfolio" || path === "/student-portfolio/") {
    currentPage = "student-portfolio";
  }

  const { 
    setCurrentPage, 
    user, 
    isAdmin, 
    isDarkMode, 
    setIsDarkMode, 
    loginWithGoogle, 
    loginAsDemoStudent,
    loginAsDemoAdmin,
    logout,
    cart
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 120) {
        setShowNavbar(false); // scrolling down
      } else {
        setShowNavbar(true); // scrolling up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleNavClick = (page: string) => {
    setCurrentPage(page as any);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: "Home", page: "home", path: "/" },
    { label: "Courses", page: "courses", path: "/courses" },
    { label: "Blog", page: "blog", path: "/blog" },
    ...(user ? [{ label: "My Enrollments", page: "my-enrollments", path: "/my-enrollments" }] : []),
    { label: "About", page: "about", path: "/about" },
    { label: "Contact", page: "contact", path: "/contact" }
  ];

  return (
    <motion.header 
      animate={{ y: showNavbar ? 0 : -85 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="sticky top-0 z-50 w-full border-b transition-colors duration-300 backdrop-blur-md bg-brand-bg/85 dark:bg-[#000000]/90 border-neutral-200 dark:border-neutral-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand Brand Identity */}
          <Link 
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <img 
              id="brand-logo-img" 
              src="/brand_logo.jpg" 
              alt="Learn 2 Future" 
              className="w-10 h-10 rounded-lg border border-brand-gold/50 object-cover group-hover:scale-105 transition-transform shadow-md shadow-brand-gold/10" 
            />
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-1">
                Learn 2 Future <Sparkles className="w-4 h-4 text-brand-gold" />
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#F5B300] font-mono leading-none">
                Learn today. Earn tomorrow.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Link Cluster */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative font-display text-sm font-medium tracking-wide transition-all py-1.5 ${
                    isActive
                      ? "text-brand-gold font-bold"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="navTabUnderline"
                      className="absolute left-0 right-0 bottom-0 h-[2.5px] bg-[#F5B300] rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Stack */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle theme mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-brand-gold" /> : <Moon className="w-5 h-5 text-neutral-800" />}
            </button>

            {/* Cart Icon Button with Dynamic Counter Badge */}
            <button
              onClick={() => setCurrentPage("cart")}
              className="relative p-2.5 rounded-full text-neutral-505 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors flex items-center"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart && cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-gold text-black text-[9px] font-mono font-black rounded-full flex items-center justify-center border-2 border-brand-bg dark:border-black animate-bounce">
                  {cart.reduce((acum, val) => acum + (val.quantity || 1), 0)}
                </span>
              )}
            </button>

            {/* Auth / Profile Stack */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-1 focus:outline-none"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User Profile"}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border-2 border-brand-gold hover:opacity-90 transition-opacity object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center text-black font-semibold uppercase">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </div>
                  )}
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-xl border p-2 shadow-xl bg-white dark:bg-[#151515] border-neutral-100 dark:border-neutral-900 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-900">
                      <p className="text-sm font-semibold truncate text-neutral-900 dark:text-white">
                        {user.displayName || "Student Partner"}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setCurrentPage("my-enrollments");
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors border-b border-neutral-100 dark:border-neutral-900/40 pb-2 mb-1"
                      >
                        <BookOpen className="w-4 h-4 text-brand-gold" />
                        <span>My Enrollments</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          const slug = user?.displayName?.toLowerCase().replace(/\s+/g, "-") || "new-student";
                          setCurrentPage("student-portfolio", slug);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors border-b border-neutral-100 dark:border-neutral-900/40 pb-2 mb-1"
                      >
                        <Sparkles className="w-4 h-4 text-brand-gold" />
                        <span>My Student Portfolio</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setCurrentPage("admin-dashboard");
                          }}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-brand-gold" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                  className="font-display text-sm font-semibold text-black bg-brand-gold hover:bg-[#F5B300]/90 px-6 py-2.5 rounded-lg transition-all shadow-lg hover:shadow-brand-gold/20 duration-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Sign In</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${loginDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {loginDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 shadow-xl overflow-hidden z-50">
                    <div className="p-2 space-y-1">
                      <button
                        onClick={async () => {
                          setLoginDropdownOpen(false);
                          try {
                            await loginWithGoogle();
                          } catch (_) {}
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-left font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm5.9-3.13c-.1-.55-.55-.93-1.1-.93h-.8v-3c0-.55-.45-1-1-1H9v-1h2c.55 0 1-.45 1-1V8h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" stroke="none" fill="currentColor"/>
                        </svg>
                        <span>Continue with Google</span>
                      </button>
                      {!(import.meta as any).env?.PROD && (
                        <>
                          <div className="h-px bg-neutral-100 dark:bg-neutral-900 my-1"></div>
                          <button
                            onClick={() => {
                              setLoginDropdownOpen(false);
                              loginAsDemoStudent();
                            }}
                            className="flex items-center space-x-2 w-full px-3 py-2.5 text-xs text-left font-bold text-neutral-900 dark:text-brand-gold hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                          >
                            <UserIcon className="w-3.5 h-3.5" />
                            <span>Demo Student Bypass</span>
                          </button>
                          <button
                            onClick={() => {
                              setLoginDropdownOpen(false);
                              loginAsDemoAdmin();
                            }}
                            className="flex items-center space-x-2 w-full px-3 py-2.5 text-xs text-left font-semibold text-zinc-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>Demo Admin Bypass</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Controller Cluster */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full text-neutral-500 dark:text-neutral-400"
              aria-label="Toggle theme mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-brand-gold" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Mobile Cart Icon Badge */}
            <button
              onClick={() => setCurrentPage("cart")}
              className="relative p-2 text-neutral-505 dark:text-neutral-400 flex items-center"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-5.5 h-5.5" />
              {cart && cart.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-brand-gold text-black text-[8px] font-mono font-bold rounded-full flex items-center justify-center border-2 border-brand-bg dark:border-black">
                  {cart.reduce((acum, val) => acum + (val.quantity || 1), 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-500 dark:text-neutral-400"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t px-4 pt-4 pb-6 space-y-3 bg-white dark:bg-[#000000] border-neutral-100 dark:border-neutral-900 transition-colors">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block w-full text-left font-display text-base font-semibold py-2 px-3 rounded-lg ${
                currentPage === item.page
                  ? "text-brand-gold bg-brand-gold/10"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Mobile Admin Link if logged in and admin */}
          {user && isAdmin && (
            <Link
              to="/admin-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 w-full text-left font-display text-base font-semibold py-2 px-3 rounded-lg text-brand-gold bg-[#F5B300]/5"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Admin Dashboard</span>
            </Link>
          )}

          <div className="border-t pt-4 border-neutral-100 dark:border-neutral-900">
            {user ? (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="profile"
                      className="w-10 h-10 rounded-full border-2 border-brand-gold object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center text-black font-semibold uppercase shrink-0">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold truncate max-w-40 text-neutral-900 dark:text-white">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-44">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    loginWithGoogle();
                  }}
                  className="w-full text-center font-display text-sm font-semibold text-white bg-neutral-800 dark:bg-neutral-900 px-4 py-3 rounded-lg border border-neutral-700 dark:border-neutral-800 cursor-pointer"
                >
                  Sign In with Google
                </button>
                {!(import.meta as any).env?.PROD && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      loginAsDemoStudent();
                    }}
                    className="w-full text-center font-display text-sm font-semibold text-black bg-brand-gold px-4 py-3 rounded-lg cursor-pointer"
                  >
                    Demo Student Bypass
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.header>
  );
};
