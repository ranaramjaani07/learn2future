import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Sparkles, Compass, CheckCircle2, AlertCircle, Camera, Loader2, ArrowRight } from "lucide-react";

export const Onboarding: React.FC = () => {
  const { user, completeOnboarding, logout } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(user?.photoURL || null);
  
  const [formData, setFormData] = useState({
    fullName: user?.displayName || "",
    dateOfBirth: "",
    gender: "Other",
    mobile: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    telegram: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size exceeds 2MB threshold. Please upload a smaller avatar.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Form validation checks
    if (!formData.fullName.trim()) {
      setError("Please specify your Full Name.");
      return;
    }
    if (!formData.mobile.trim()) {
      setError("Mobile Number is required for communication dispatches.");
      return;
    }
    if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim()) {
      setError("Please complete your physical address details.");
      return;
    }

    setLoading(true);
    try {
      await completeOnboarding({
        ...formData,
        photoURL: profilePic || ""
      });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-950 text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Background Accents for Luxury feel */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-gold/5 blur-3xl rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-gold/5 blur-3xl rounded-full" />

      <div className="w-full max-w-2xl bg-[#0f0f0f] border border-neutral-900 rounded-3xl p-6 sm:p-10 relative z-10 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-300">
        
        {/* Header Block */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brand-gold/10 text-brand-gold border border-brand-gold/25 rounded-full text-xs font-mono tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>EXECUTIVE ALUMNI ONBOARDING</span>
          </div>
          <h2 className="text-3xl font-display font-extrabold text-white tracking-tight">
            Complete Student Registration
          </h2>
          <p className="text-sm text-neutral-400 max-w-lg mx-auto">
            Authorize your profile properties to activate access to the premium Study Lounges and Telegram Broadcasts.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-900 text-red-400 text-sm rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          
          {/* Avatar Picture Portal */}
          <div className="flex flex-col items-center space-y-2 mb-4">
            <div className="relative group cursor-pointer">
              {profilePic ? (
                <img 
                  src={profilePic} 
                  alt="Profile Avatar" 
                  className="w-24 h-24 rounded-full border-2 border-brand-gold object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-neutral-900 border-2 border-neutral-800 flex items-center justify-center text-neutral-500 hover:border-brand-gold transition-colors">
                  <Camera className="w-8 h-8" />
                </div>
              )}
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 w-8 h-8 bg-brand-gold text-black rounded-full flex items-center justify-center cursor-pointer hover:bg-gold transition-all active:scale-95 shadow-md"
              >
                <Camera className="w-4 h-4" />
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
            <span className="text-[11px] font-mono text-neutral-500">IMAGE SIZE UP TO 2MB</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Full Name */}
            <div className="space-y-1.5 input-container">
              <label className="text-neutral-400 font-medium">Full Name (Authorized)</label>
              <input
                id="onboarding-fullname"
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full bg-neutral-900/60 border border-neutral-800 focus:border-brand-gold rounded-xl px-4 py-3 placeholder-neutral-600 outline-none transition-colors"
              />
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-1.5 input-container">
              <label className="text-neutral-500 font-medium opacity-70">Student Email Address (Verified)</label>
              <input
                id="onboarding-email"
                type="email"
                readOnly
                value={user?.email || ""}
                placeholder="email@example.com"
                className="w-full bg-neutral-950 border border-neutral-900/60 text-neutral-500 rounded-xl px-4 py-3 cursor-not-allowed outline-none font-mono"
              />
            </div>

            {/* Mobile Contact */}
            <div className="space-y-1.5 input-container">
              <label className="text-neutral-400 font-medium">Mobile Number</label>
              <input
                id="onboarding-mobile"
                type="tel"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder="+91 9876543210"
                className="w-full bg-neutral-900/60 border border-neutral-800 focus:border-brand-gold rounded-xl px-4 py-3 placeholder-neutral-600 outline-none transition-colors"
              />
            </div>

            {/* Telegram URL or Handle */}
            <div className="space-y-1.5 input-container">
              <label className="text-neutral-400 font-medium">Telegram @Handle (Private Portal Access)</label>
              <input
                id="onboarding-telegram"
                type="text"
                name="telegram"
                value={formData.telegram}
                onChange={handleInputChange}
                placeholder="@username"
                className="w-full bg-neutral-900/60 border border-neutral-800 focus:border-brand-gold rounded-xl px-4 py-3 placeholder-neutral-600 outline-none transition-colors"
              />
            </div>

            {/* Date of birth */}
            <div className="space-y-1.5 input-container">
              <label className="text-neutral-400 font-medium">Date of Birth</label>
              <input
                id="onboarding-dob"
                type="date"
                name="dateOfBirth"
                required
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full bg-neutral-900/60 border border-neutral-800 focus:border-brand-gold rounded-xl px-4 py-3 text-neutral-350 outline-none transition-colors"
              />
            </div>

            {/* Gender SELECT */}
            <div className="space-y-1.5 input-container">
              <label className="text-neutral-400 font-medium">Gender Choice</label>
              <select
                id="onboarding-gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full bg-neutral-900/60 border border-neutral-800 focus:border-brand-gold rounded-xl px-4 py-3 text-neutral-350 outline-none transition-colors"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer Not to Disclose">Prefer Not to Disclose</option>
              </select>
            </div>

          </div>

          {/* Address Line */}
          <div className="space-y-1.5 input-container">
            <label className="text-neutral-400 font-medium">Physical Billing & Contact Address</label>
            <input
              id="onboarding-address"
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Suite No / Flat No, Street Address Line"
              className="w-full bg-neutral-900/60 border border-neutral-800 focus:border-brand-gold rounded-xl px-4 py-3 placeholder-neutral-600 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* City */}
            <div className="space-y-1.5 input-container">
              <label className="text-neutral-400 font-medium">City</label>
              <input
                id="onboarding-city"
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Mumbai"
                className="w-full bg-neutral-900/60 border border-neutral-800 focus:border-brand-gold rounded-xl px-4 py-3 placeholder-neutral-600 outline-none transition-colors"
              />
            </div>

            {/* State */}
            <div className="space-y-1.5 input-container">
              <label className="text-neutral-400 font-medium">State / Region</label>
              <input
                id="onboarding-state"
                type="text"
                name="state"
                required
                value={formData.state}
                onChange={handleInputChange}
                placeholder="Maharashtra"
                className="w-full bg-neutral-900/60 border border-neutral-800 focus:border-brand-gold rounded-xl px-4 py-3 placeholder-neutral-600 outline-none transition-colors"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5 input-container">
              <label className="text-neutral-400 font-medium">Country</label>
              <input
                id="onboarding-country"
                type="text"
                name="country"
                required
                value={formData.country}
                onChange={handleInputChange}
                placeholder="India"
                className="w-full bg-neutral-900/60 border border-neutral-800 focus:border-brand-gold rounded-xl px-4 py-3 placeholder-neutral-600 outline-none transition-colors"
              />
            </div>

          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-900">
            <button
              type="button"
              onClick={logout}
              className="text-neutral-500 hover:text-white transition-colors py-2 px-4 text-xs font-mono font-bold tracking-tight uppercase"
            >
              Sign Out Session
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-brand-gold hover:bg-[#F5B300]/90 text-black font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-brand-gold/10 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Validating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Activate My Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
