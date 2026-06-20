import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, 
  QrCode, CreditCard, ChevronRight, CheckCircle, Ticket, 
  AlertCircle, Upload, Play, Sparkles, BookOpen, Clock, Loader2 
} from "lucide-react";
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

export const CartPage: React.FC = () => {
  const { 
    cart, 
    user, 
    dbUser, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart, 
    globalSettings,
    setCurrentPage,
    logUserActivity
  } = useApp();

  // Multi-step phase: "review" | "details" | "payment" | "success"
  const [checkoutStep, setCheckoutStep] = useState<"review" | "details" | "payment" | "success">("review");
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");
  
  // Details state
  const [checkoutForm, setCheckoutForm] = useState({
    name: dbUser?.fullName || user?.displayName || "",
    email: dbUser?.email || user?.email || "",
    mobile: dbUser?.mobile || "",
    telegram: dbUser?.telegramUsername || "",
    address: dbUser?.address || "",
    city: dbUser?.city || "",
    state: dbUser?.state || "",
    country: dbUser?.country || "India"
  });
  const [formError, setFormError] = useState("");

  // Dynamic state for automated checkout tracking
  const [uploadError, setUploadError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [createdOrderRef, setCreatedOrderRef] = useState<any | null>(null);

  // Dynamic load Razorpay official standard SDK script in background
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Auto-launch payment whenever step 3 "payment" is entered by the student
  useEffect(() => {
    if (checkoutStep === "payment") {
      triggerRazorpayPayment();
    }
  }, [checkoutStep]);

  // Auto pre-fill details when dbUser becomes available
  useEffect(() => {
    if (dbUser) {
      setCheckoutForm({
        name: dbUser.fullName || user?.displayName || "",
        email: dbUser.email || user?.email || "",
        mobile: dbUser.mobile || "",
        telegram: dbUser.telegramUsername || "",
        address: dbUser.address || "",
        city: dbUser.city || "",
        state: dbUser.state || "",
        country: dbUser.country || "India"
      });
    }
  }, [dbUser, user]);

  const cartSubtotal = cart.reduce((acc, curr) => acc + (curr.price * (curr.quantity || 1)), 0);
  
  // Calculate discount
  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = (cartSubtotal * discountValue) / 100;
  } else if (discountType === "fixed") {
    discountAmount = discountValue;
  }
  const finalCost = Math.max(0, cartSubtotal - discountAmount);

  // Search Coupon code in Firestore
  const applyCouponHandler = async () => {
    setCouponError("");
    if (!couponCode.trim()) return;
    try {
      const qCode = couponCode.trim().toUpperCase();
      const couponRef = doc(db, "coupons", qCode);
      const couponSnap = await getDoc(couponRef);
      if (couponSnap.exists()) {
        const data = couponSnap.data();
        if (!data.isActive) {
          setCouponError("This promo code is currently expired or inactive.");
          return;
        }
        if (data.minOrderValue && cartSubtotal < data.minOrderValue) {
          setCouponError(`Min order total to apply this code is ₹${data.minOrderValue.toLocaleString()}`);
          return;
        }
        setDiscountType(data.type);
        setDiscountValue(data.value);
        setAppliedCoupon(qCode);
        setCouponCode("");
      } else {
        setCouponError("Promo code is invalid. Please verify spelling.");
      }
    } catch (err: any) {
      console.error(err);
      setCouponError("Could not connect to query promotion codes.");
    }
  };

  const removeCouponHandler = () => {
    setDiscountType(null);
    setDiscountValue(0);
    setAppliedCoupon(null);
  };

  // Submit Detail block
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!checkoutForm.name.trim() || !checkoutForm.email.trim() || !checkoutForm.mobile.trim() || !checkoutForm.address.trim()) {
      setFormError("Please fill out all required fields to register delivery parameters.");
      return;
    }
    setCheckoutStep("payment");
    
    // Meta Pixel InitiateCheckout Event
    try {
      if (typeof (window as any).fbq === "function") {
        (window as any).fbq("track", "InitiateCheckout", {
          value: Number(finalCost),
          currency: "INR",
          content_name: cart[0]?.productTitle || "Digital Program Checklist",
          content_ids: cart.map(item => item.productId)
        });
      }
    } catch (e) {
      console.warn("Meta Pixel InitiateCheckout tracking failed:", e);
    }
    
    logUserActivity("Checkout Initiated", `Began Checkout for ${cart.length} items totaling ₹${finalCost}`);
  };

  // Automated razorpay checkout sequence triggering order generation and signature audit
  const triggerRazorpayPayment = async () => {
    setUploadError("");
    setSubmittingOrder(true);
    
    try {
      // 1. Create native checkout order payload in backend session
      const response = await fetch("/api/pay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: cart[0]?.productId || "multiple_items",
          amount: finalCost,
          userId: user?.uid || "anonymous",
          buyerName: checkoutForm.name,
          email: checkoutForm.email,
          telegram: checkoutForm.telegram,
          couponCode: appliedCoupon || "None"
        })
      });

      if (!response.ok) {
        let errMsg = "Failed to establish payment gateway session. Please verify details and retry.";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {
          try {
            const rawText = await response.text();
            if (rawText) {
              errMsg = `${errMsg} (${rawText.substring(0, 100)})`;
            }
          } catch (__) {}
        }
        throw new Error(errMsg);
      }

      let orderData: any;
      try {
        orderData = await response.json(); // { id, amount, currency, key_id }
      } catch (e) {
        throw new Error("Unable to parse payment gateway session response. Please verify server connection and try again.");
      }

      // 2. Load standard official Razorpay interactive overlay popup in window
      if (!(window as any).Razorpay) {
        throw new Error("Razorpay SDK is not initialized on the device yet. Please retry in a few seconds.");
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Learn 2 Future",
        description: cart.length > 1 ? `${cart.length} Courses Bundle` : (cart[0]?.productTitle || "Digital Training Program"),
        order_id: orderData.id,
        handler: async function (paymentResponse: any) {
          try {
            setSubmittingOrder(true);
            setUploadError("");

            const verifyRes = await fetch("/api/pay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                courseId: cart[0]?.productId || "multiple_items",
                courseName: cart.length > 1 ? `${cart.length} Courses Bundle` : (cart[0]?.productTitle || "Digital Training Program"),
                userId: user?.uid || "anonymous",
                buyerName: checkoutForm.name,
                email: checkoutForm.email,
                telegram: checkoutForm.telegram,
                price: finalCost,
                originalPrice: cartSubtotal,
                discountApplied: discountAmount,
                couponCode: appliedCoupon || "None",
                cartItems: cart.map(item => ({
                  productId: item.productId,
                  productTitle: item.productTitle,
                  productImage: item.productImage,
                  price: item.price
                }))
              })
            });

            if (!verifyRes.ok) {
              const vErr = await verifyRes.json();
              throw new Error(vErr.error || "Checkout validation failed. Signature was rejected by security desk.");
            }

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await clearCart();

              // Setup local order confirmation tracking
              setCreatedOrderRef({
                id: verifyData.orderId,
                email: checkoutForm.email,
                courseName: cart.length > 1 ? `${cart.length} Courses Bundle` : (cart[0]?.productTitle || "Digital Course"),
                status: "Verified"
              });

              // Tracking integration
              try {
                if (typeof (window as any).fbq === "function") {
                  (window as any).fbq("track", "Purchase", {
                    value: Number(finalCost),
                    currency: "INR",
                    content_name: cart.length > 1 ? `${cart.length} Courses Bundle` : (cart[0]?.productTitle || "Digital Course"),
                    content_ids: cart.map(item => item.productId),
                    content_type: "product",
                    order_id: verifyData.orderId
                  });
                }
              } catch (_) {}

              setCheckoutStep("success");
              setCurrentPage("thank-you", verifyData.orderId);
              await logUserActivity("Purchase Verified", `Completed Razorpay Transaction for Order #${verifyData.orderId}`);
            }
          } catch (verifyError: any) {
            console.error("Payment verification failure:", verifyError);
            setUploadError("Payment completed, but verification failed: " + (verifyError.message || "Unknown error"));
          } finally {
            setSubmittingOrder(false);
          }
        },
        prefill: {
          name: checkoutForm.name,
          email: checkoutForm.email,
          contact: checkoutForm.mobile
        },
        theme: {
          color: "#F5B300"
        },
        modal: {
          ondismiss: function () {
            setSubmittingOrder(false);
          }
        }
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.open();

    } catch (paymentErr: any) {
      console.error("Razorpay initiation error:", paymentErr);
      setUploadError(paymentErr.message || "Could not instantiate Razorpay. Please verify administration API keys under Settings.");
      setSubmittingOrder(false);
    }
  };

  if (cart.length === 0 && checkoutStep !== "success") {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-neutral-950 flex flex-col justify-center items-center p-6 text-white font-sans animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-[#0d0d0d] border border-neutral-900 rounded-3xl p-8 sm:p-10 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-gold/5 blur-3xl rounded-full" />
          <div className="w-16 h-16 bg-brand-gold/10 border border-brand-gold/25 rounded-full flex items-center justify-center mx-auto text-brand-gold">
            <ShoppingBag className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-2xl font-display font-black tracking-tight">Your cart is empty</h3>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
              Please visit the Course Library to add professional digital study guides and blueprints.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setCurrentPage("courses")}
            className="inline-flex items-center gap-1.5 px-6 py-3.5 bg-brand-gold hover:bg-[#ffd34d] text-black font-mono font-bold text-xs uppercase tracking-widest rounded-xl transition shadow"
          >
            <span>Browse Library</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-950 text-white font-sans text-left relative overflow-hidden py-10">
      
      {/* Visual background luxury blur accents layout */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-gold/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-gold/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 relative z-10 space-y-8">
        
        {/* Header timeline / Stage Indicator checks */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-900 pb-5">
          <div>
            <h2 className="text-3xl font-display font-extrabold text-white flex items-center gap-2 tracking-tight">
              <ShoppingBag className="w-8 h-8 text-brand-gold" />
              <span>Checkout Ledger</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">Review items, fill out billing settings, and unlock complete lifetime access.</p>
          </div>

          {/* Stepper tracker */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-[9px] font-mono tracking-wider font-bold">
            <span className={`px-2 py-1.5 rounded-lg border ${checkoutStep === "review" ? "bg-brand-gold border-brand-gold text-black" : "bg-neutral-900 border-neutral-800 text-neutral-400"}`}>1. REVIEW</span>
            <ChevronRight className="w-3 h-3 text-neutral-600" />
            <span className={`px-2 py-1.5 rounded-lg border ${checkoutStep === "details" ? "bg-brand-gold border-brand-gold text-black" : "bg-neutral-900 border-neutral-800 text-neutral-400"}`}>2. DETAILS</span>
            <ChevronRight className="w-3 h-3 text-neutral-600" />
            <span className={`px-2 py-1.5 rounded-lg border ${checkoutStep === "payment" ? "bg-brand-gold border-brand-gold text-black" : "bg-neutral-900 border-neutral-800 text-neutral-400"}`}>3. PAYMENT</span>
            <ChevronRight className="w-3 h-3 text-neutral-600" />
            <span className={`px-2 py-1.5 rounded-lg border ${checkoutStep === "success" ? "bg-green-500 border-green-600 text-white" : "bg-neutral-900 border-neutral-800 text-neutral-400"}`}>4. UNLOCK</span>
          </div>
        </div>

        {/* Dynamic page state cases */}
        {checkoutStep === "review" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* List items block */}
            <div className="lg:col-span-2 space-y-4">
              <span className="text-[10px] font-mono tracking-widest text-[#999] uppercase">CART ITEMS ({cart.length})</span>
              <div className="space-y-3.5">
                {cart.map((item) => (
                  <div key={item.id} className="bg-[#0b0b0b] border border-neutral-900 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center relative group hover:border-brand-gold/20 transition-colors">
                    <div className="flex gap-4 items-center min-w-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-neutral-850">
                        <img src={item.productImage} alt={item.productTitle} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-block text-[9px] font-mono tracking-wide text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full border border-brand-gold/10">{item.productCategory || "Course"}</span>
                        <h4 className="text-sm font-bold text-white truncate max-w-sm mt-1">{item.productTitle}</h4>
                        <p className="text-[11px] text-neutral-400 mt-1 font-mono">₹{Number(item.price).toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto gap-4 border-t border-neutral-900 sm:border-0 pt-3 sm:pt-0 shrink-0">
                      
                      {/* Quantity switcher */}
                      <div className="flex items-center gap-1.5 bg-black/45 border border-neutral-850 p-1.5 rounded-xl text-xs font-mono">
                        <button 
                          onClick={() => updateCartQuantity(item.id, (item.quantity || 1) - 1)}
                          className="p-1 hover:bg-neutral-800 text-neutral-400 rounded transition-colors"
                          title="Reduce quantity by 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-white font-bold">{item.quantity || 1}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.id, (item.quantity || 1) + 1)}
                          className="p-1 hover:bg-neutral-800 text-neutral-400 rounded transition-colors"
                          title="Increase quantity by 1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-extrabold text-neutral-200">₹{(Number(item.price) * (item.quantity || 1)).toLocaleString("en-IN")}</span>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 bg-neutral-900 hover:bg-red-950/30 text-neutral-400 hover:text-red-400 border border-neutral-850 rounded-xl transition-all"
                          title="Remove item from checkout"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sum section */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-widest text-[#999] uppercase">ORDER BILL SUMMARY</span>
              <div className="bg-[#0b0b0b] border border-neutral-900 rounded-3xl p-5 sm:p-6 space-y-5 text-xs font-sans relative">
                
                {/* Coupon component box */}
                <div className="space-y-2 border-b border-neutral-900 pb-4">
                  <span className="text-[10px] font-mono uppercase text-neutral-400">Coupon Discount Code</span>
                  {appliedCoupon ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/25 p-3 rounded-2xl flex items-center justify-between text-yellow-500">
                      <div className="flex items-center gap-1.5">
                        <Ticket className="w-4 h-4 text-brand-gold animate-bounce" />
                        <span className="font-mono font-bold text-xs">{appliedCoupon} Applied</span>
                      </div>
                      <button 
                        onClick={removeCouponHandler}
                        className="text-[10px] uppercase font-mono tracking-wider font-bold underline hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <input 
                        type="text"
                        placeholder="WELCOME30 or equivalent"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="bg-black border border-neutral-850 rounded-xl px-3 py-2 outline-none focus:border-brand-gold w-full text-xs font-mono"
                      />
                      <button 
                        onClick={applyCouponHandler}
                        className="bg-neutral-900 hover:bg-neutral-850 text-brand-gold border border-neutral-800 px-3.5 py-2 rounded-xl text-xs font-mono uppercase font-bold"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-[10px] text-red-400 mt-1 font-mono flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {couponError}</p>}
                </div>

                <div className="space-y-3 font-mono border-b border-neutral-900 pb-4">
                  <div className="flex justify-between">
                    <span className="text-neutral-450 uppercase text-[10px]">Cart Total</span>
                    <span className="font-bold text-neutral-200">₹{cartSubtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-yellow-500">
                      <span className="uppercase text-[10px]">Coupon Discount</span>
                      <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-450 uppercase text-[10px]">Estimated Taxes</span>
                    <span className="text-neutral-500 font-bold">₹0.00</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-brand-gold font-bold uppercase font-mono">Total Payable Cost</span>
                  <span className="font-mono font-extrabold text-neutral-100">₹{finalCost.toLocaleString("en-IN")}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setCheckoutStep("details")}
                  className="w-full bg-brand-gold hover:bg-[#ffd34d] text-black font-mono font-bold text-xs uppercase tracking-widest py-4 px-6 rounded-2xl transition flex items-center justify-center gap-2 shadow"
                >
                  <span>Proceed To Checkout</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>

          </div>
        )}

        {checkoutStep === "details" && (
          <div className="max-w-2xl mx-auto bg-[#0b0b0b] border border-neutral-900 rounded-3xl p-6 sm:p-10 text-xs text-left relative shadow-2xl">
            <h3 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-gold" />
              <span>Deliverable Student Details</span>
            </h3>
            <p className="text-[11px] text-neutral-450 mt-1">Please authorize your delivery coordinates for course dispatches. Pre-filled from your executive verification file.</p>
            
            {formError && (
              <div className="mt-4 p-4 bg-red-950/40 border border-red-900 text-red-400 rounded-xl flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleDetailsSubmit} className="space-y-5 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-medium">Authorized Full Name *</label>
                  <input 
                    type="text"
                    required
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm({...checkoutForm, name: e.target.value})}
                    placeholder="Full legal name"
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-3 text-neutral-200 outline-none focus:border-brand-gold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-medium font-mono">Email Address (ReadOnly) *</label>
                  <input 
                    type="email"
                    readOnly
                    required
                    value={checkoutForm.email}
                    className="w-full bg-neutral-900 border border-neutral-850 rounded-xl px-4 py-3 text-neutral-500 cursor-not-allowed outline-none text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-medium">Mobile WhatsApp Contact Code *</label>
                  <input 
                    type="text"
                    required
                    value={checkoutForm.mobile}
                    onChange={(e) => setCheckoutForm({...checkoutForm, mobile: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-3 text-neutral-200 outline-none focus:border-brand-gold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-medium">Telegram Identifier (Username)</label>
                  <input 
                    type="text"
                    value={checkoutForm.telegram}
                    onChange={(e) => setCheckoutForm({...checkoutForm, telegram: e.target.value})}
                    placeholder="@username"
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-3 text-neutral-200 outline-none focus:border-brand-gold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-medium">Physical Delivery Location Address *</label>
                <input 
                  type="text"
                  required
                  value={checkoutForm.address}
                  onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})}
                  placeholder="Apartment, Street Name"
                  className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-3 text-neutral-200 outline-none focus:border-brand-gold text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-medium">City Location *</label>
                  <input 
                    type="text"
                    required
                    value={checkoutForm.city}
                    onChange={(e) => setCheckoutForm({...checkoutForm, city: e.target.value})}
                    placeholder="Delhi"
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-3 text-neutral-200 outline-none focus:border-brand-gold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-medium">State / Region *</label>
                  <input 
                    type="text"
                    required
                    value={checkoutForm.state}
                    onChange={(e) => setCheckoutForm({...checkoutForm, state: e.target.value})}
                    placeholder="Delhi NCR"
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-3 text-neutral-200 outline-none focus:border-brand-gold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-medium">Country *</label>
                  <input 
                    type="text"
                    required
                    value={checkoutForm.country}
                    onChange={(e) => setCheckoutForm({...checkoutForm, country: e.target.value})}
                    placeholder="India"
                    className="w-full bg-black border border-neutral-850 rounded-xl px-4 py-3 text-neutral-200 outline-none focus:border-brand-gold text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between gap-4">
                <button 
                  type="button"
                  onClick={() => setCheckoutStep("review")}
                  className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 px-6 py-3.5 rounded-xl text-xs font-mono uppercase font-bold text-neutral-300"
                >
                  Back to Review
                </button>
                <button 
                  type="submit"
                  className="bg-brand-gold hover:bg-[#ffd34d] text-black font-mono font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <span>Verify Payment Gateway</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              </div>
            </form>
          </div>
        )}

        {checkoutStep === "payment" && (
          <div className="max-w-xl mx-auto bg-[#0b0b0b] border border-neutral-900 rounded-3xl p-8 sm:p-10 space-y-8 text-center relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-gold/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="w-16 h-16 bg-brand-gold/10 border border-brand-gold/25 rounded-full flex items-center justify-center mx-auto text-brand-gold">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-mono tracking-widest text-brand-gold bg-brand-gold/10 border border-brand-gold/15 py-1 px-3.5 rounded-full w-max mx-auto uppercase">Secure Automated Gateway</span>
              <h3 className="text-xl font-display font-extrabold text-white">Opening Razorpay Checkout...</h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                Please complete the secure authenticated payment overlay on your device. We are connecting you to Indian banking servers. Do not refresh or go back.
              </p>
            </div>

            {uploadError && (
              <div className="p-4 bg-red-950/45 border border-red-900 text-red-400 rounded-2xl text-xs font-mono text-left flex items-start gap-2 max-w-md mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="bg-black/45 border border-neutral-850 p-5 rounded-2xl max-w-md mx-auto space-y-2 text-left text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-500 uppercase">Total Items:</span>
                <span className="font-bold text-neutral-300">{cart.length} Courses</span>
              </div>
              <div className="flex justify-between border-t border-neutral-900 pt-2 mt-2 text-yellow-500">
                <span className="font-bold uppercase">Total Bill Payable:</span>
                <span className="font-extrabold text-sm">₹{finalCost.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3 max-w-md mx-auto select-none">
              <button 
                type="button"
                onClick={() => setCheckoutStep("details")}
                className="w-full sm:w-auto bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 px-6 py-3.5 rounded-xl text-xs font-mono uppercase font-bold text-neutral-300 transition-colors"
              >
                Go Back
              </button>
              
              <button 
                type="button"
                onClick={triggerRazorpayPayment}
                disabled={submittingOrder}
                className="w-full sm:w-1/2 bg-brand-gold hover:bg-[#ffd34d] disabled:opacity-50 text-black font-mono font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow"
              >
                {submittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Launching...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Retry Checkout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {checkoutStep === "success" && createdOrderRef && (
          <div className="max-w-md mx-auto bg-[#0b0b0b] border border-neutral-900 rounded-3xl p-8 sm:p-10 text-center space-y-6 relative overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-green-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/25 rounded-full flex items-center justify-center mx-auto text-green-400">
              <CheckCircle className="w-9 h-9 animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-mono tracking-widest text-green-400 bg-green-500/10 border border-green-500/15 py-1 px-3 rounded-full w-max mx-auto uppercase">Order Submited Successfully</span>
              <h3 className="text-2xl font-display font-black tracking-tight text-white mt-2">Access Portal Activated</h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                {createdOrderRef.status === "Verified" 
                  ? "Your card payment has been auto-verified. Lifetime academic access has been successfully allocated."
                  : "We have received your manual transaction proof screenshot. A platform administrator will review it shortly."
                }
              </p>
            </div>

            <div className="bg-black/35 border border-neutral-900 rounded-2xl p-4.5 space-y-2 text-left font-mono text-[10.5px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">ORDER LEDGER ID:</span>
                <span className="font-bold text-neutral-300 select-all truncate max-w-[150px]">{createdOrderRef.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">STUDENT EMAIL:</span>
                <span className="font-bold text-neutral-300 truncate max-w-[150px]">{createdOrderRef.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">VERIFIED STATUS:</span>
                <span className={`font-bold ${createdOrderRef.status === "Verified" ? "text-green-500" : "text-amber-500"}`}>{createdOrderRef.status.toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-850 pt-2 mt-2">
                <span className="text-brand-gold font-bold">TOTAL DISPATCHED BILL:</span>
                <span className="font-extrabold text-neutral-200">₹{finalCost.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button 
                onClick={() => setCurrentPage("my-enrollments")}
                className="w-full bg-brand-gold hover:bg-[#ffd34d] text-black font-mono font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition shadow flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-4 h-4 text-black" />
                <span>Go to Study Area</span>
              </button>
              <button 
                onClick={() => setCurrentPage("home")}
                className="w-full bg-neutral-900 border border-neutral-805 text-neutral-300 font-mono text-[11px] uppercase tracking-wider py-2 rounded-xl hover:bg-neutral-850"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
