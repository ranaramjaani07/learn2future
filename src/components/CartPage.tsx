import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, 
  QrCode, CreditCard, ChevronRight, CheckCircle, Ticket, 
  AlertCircle, Upload, Play, Sparkles, BookOpen, Clock, Loader2,
  X, Copy
} from "lucide-react";
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage, handleFirestoreError, OperationType } from "../firebase";

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
  const [selectedProductForPopup, setSelectedProductForPopup] = useState<any | null>(null);

  // Dynamic state for automated checkout tracking
  const [uploadError, setUploadError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [createdOrderRef, setCreatedOrderRef] = useState<any | null>(null);
  const [simulatedOrder, setSimulatedOrder] = useState<any | null>(null);

  // States for Razorpay Checkout Audit & Fallback
  const [checkoutLogs, setCheckoutLogs] = useState<string[]>([]);
  const [createdOrderData, setCreatedOrderData] = useState<any | null>(null);
  const [popupBlockerDetected, setPopupBlockerDetected] = useState<boolean>(false);
  const [razorpayOpenedSuccessfully, setRazorpayOpenedSuccessfully] = useState<boolean>(false);

  const addCheckoutLog = (message: string) => {
    console.log(`[CHECKOUT-LOG] ${message}`);
    setCheckoutLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // States for manual UPI billing backup flow
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "upi">("razorpay");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Copy UPI Address to device clipboard
  const handleCopyUPI = () => {
    const upi = globalSettings.upiId || "uniquesolutions@ybl";
    navigator.clipboard.writeText(upi);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Helper to compress images on client side to prevent excessively large payload writes
  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  // Helper to convert base64 back to a Blob or File for Storage upload
  const base64ToBlob = (base64Str: string): Blob => {
    try {
      const parts = base64Str.split(";base64,");
      const contentType = parts[0].split(":")[1] || "image/jpeg";
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: contentType });
    } catch (e) {
      console.warn("base64ToBlob failure, returning small empty blob", e);
      return new Blob([], { type: "image/jpeg" });
    }
  };

  // Capture file selections for UPI screens
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setUploadError("This image exceeds our maximum 2MB size filter. Please optimize/crop or capture a smaller screenshot of the transaction.");
        return;
      }
      setUploadError("");
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
          // Compress on-the-fly to max width 800px to ensure tiny sizes (< 100KB)
          const compressedBase64 = await compressImage(rawBase64, 800, 800, 0.75);
          setScreenshotPreview(compressedBase64);
          
          // Convert optimized base64 back to Blob for standard Firebase Storage upload
          const optimizedBlob = base64ToBlob(compressedBase64);
          setScreenshotFile(optimizedBlob as any);
        } catch (err) {
          console.error("Compression flow error inside cart, falling back to original file", err);
          setScreenshotFile(file);
          setScreenshotPreview(rawBase64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
    if (checkoutStep === "payment" && paymentMethod === "razorpay") {
      triggerRazorpayPayment();
    }
  }, [checkoutStep, paymentMethod]);

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

  // SECURITY FIX: Server-side verify-payment already writes to Firestore via REST API.
  // This function now only updates local UI state — no duplicate client-side Firestore writes.
  const logTransactionDirectlyToDb = async (orderId: string, paymentId: string, gatewayOrderId: string) => {
    if (!user) return;
    // Server has already written orders + userPurchases via verify-payment serverless function.
    // We just log the activity locally.
    try {
      await logUserActivity("Purchase Complete", `Order ${orderId} enrolled via Razorpay (${paymentId})`);
    } catch (_) {}
    console.log("[CHECKOUT-CLIENT] Server wrote enrollment records. Client-side duplicate write skipped (security fix).");
  };

  // Trigger automatic check out verification for sandbox mode
  const triggerSimulatedSuccess = async (targetSimOrder: any) => {
    if (!targetSimOrder) return;
    setSubmittingOrder(true);
    setUploadError("");
    const mockPaymentId = "pay_sim_" + Math.random().toString(36).substring(2, 10);
    try {
      const verifyRes = await fetch("/api/pay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_payment_id: mockPaymentId,
          razorpay_order_id: targetSimOrder.id,
          razorpay_signature: "simulated_bypass_sig",
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
        let errMsg = "Simulated payment verification failed on server.";
        try {
          const vErr = await verifyRes.json();
          errMsg = vErr.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        // Authenticated direct client database write
        await logTransactionDirectlyToDb(verifyData.orderId, mockPaymentId, targetSimOrder.id);

        await clearCart();
        setCreatedOrderRef({
          id: verifyData.orderId,
          email: checkoutForm.email,
          courseName: cart.length > 1 ? `${cart.length} Courses Bundle` : (cart[0]?.productTitle || "Digital Course"),
          status: "Verified"
        });

        // Track pixel if loaded
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
        await logUserActivity("Purchase Verified", `Completed Simulated Transaction for Order #${verifyData.orderId}`);
      }
    } catch (err: any) {
      console.error("Simulation verify error:", err);
      setUploadError("Verification of simulated transaction failed: " + (err.message || "Unknown error"));
    } finally {
      setSubmittingOrder(false);
      setSimulatedOrder(null);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Share payment verification logic across standard and fallback checkout triggers
  const handlePaymentVerification = async (paymentResponse: any, orderData: any) => {
    try {
      addCheckoutLog("Initiating server-side cryptographic signature verification...");
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
        addCheckoutLog("Payment verified successfully on server! Enrolling student in classes...");
        // Authenticated direct client database write
        await logTransactionDirectlyToDb(verifyData.orderId, paymentResponse.razorpay_payment_id || "pay_mock", paymentResponse.razorpay_order_id);

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
      addCheckoutLog(`Verification error: ${verifyError.message || verifyError}`);
      setUploadError("Payment completed, but verification failed: " + (verifyError.message || "Unknown error"));
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Direct, bulletproof user-gesture handler synchronous launch (immune to popup blockers)
  const handleFallbackClick = () => {
    addCheckoutLog("Button clicked: User manually requested direct fallback checkout window.");
    if (!createdOrderData) {
      addCheckoutLog("Error: Fallback payment clicked but no created order data was found. Retrying order creation...");
      triggerRazorpayPayment();
      return;
    }

    try {
      addCheckoutLog("Synchronously initializing standard Razorpay popover options...");
      const options = {
        key: createdOrderData.key_id,
        amount: createdOrderData.amount,
        currency: createdOrderData.currency,
        name: "Learn 2 Future",
        description: cart.length > 1 ? `${cart.length} Courses Bundle` : (cart[0]?.productTitle || "Digital Training Program"),
        order_id: createdOrderData.id,
        handler: async function (paymentResponse: any) {
          addCheckoutLog("Razorpay popup success handler response intercepted!");
          await handlePaymentVerification(paymentResponse, createdOrderData);
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
            addCheckoutLog("Razorpay user-dismissed event caught.");
            setSubmittingOrder(false);
          }
        }
      };

      addCheckoutLog("Razorpay popup opened: Calling rzpInstance.open() synchronously...");
      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.open();
      setPopupBlockerDetected(false);
      setRazorpayOpenedSuccessfully(true);
    } catch (err: any) {
      addCheckoutLog(`Error during manual fallback invocation: ${err.message || err}`);
    }
  };

  // Automated razorpay checkout sequence triggering order generation and signature audit
  const triggerRazorpayPayment = async () => {
    setUploadError("");
    setSubmittingOrder(true);
    setSimulatedOrder(null);
    setPopupBlockerDetected(false);
    setRazorpayOpenedSuccessfully(false);
    
    // Audit log initiation
    setCheckoutLogs([]);
    addCheckoutLog("Button clicked: Initiated secure Razorpay checkout process...");

    try {
      // 1. Create native checkout order payload in backend session
      addCheckoutLog("Contacting backend service to create Razorpay Order Session (/api/pay/create-order)...");
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
          couponCode: appliedCoupon || "None",
          cartItems: cart.map(item => ({
            productId: item.productId,
            productTitle: item.productTitle,
            productImage: item.productImage,
            price: item.price
          }))
        })
      });

      if (!response.ok) {
        let errMsg = "Failed to establish payment gateway session. Please verify details and retry.";
        try {
          const rawText = await response.text();
          try {
            const errData = JSON.parse(rawText);
            errMsg = errData.error || errMsg;
          } catch (_) {
            if (rawText) {
              errMsg = `${errMsg} (${rawText.substring(0, 150)})`;
            }
          }
        } catch (_) {}
        addCheckoutLog(`Order creation failed: ${errMsg}`);
        throw new Error(errMsg);
      }

      let orderData: any;
      try {
        orderData = await response.json(); // { id, amount, currency, key_id, isSimulated }
        setCreatedOrderData(orderData);
        addCheckoutLog(`Order created successfully. Server Session ID: ${orderData.id}`);
      } catch (e) {
        addCheckoutLog("Order generation failed: Response format not recognized by client parser.");
        throw new Error("Unable to parse payment gateway session response. Please verify server connection and try again.");
      }

      // If simulated order is forced by backend, trigger simulated checkout directly
      if (orderData.isSimulated) {
        addCheckoutLog("Order created: Forced sandbox bypass requested by administrative authority.");
        setSimulatedOrder(orderData);
        setSubmittingOrder(false);
        return;
      }

      // 2. Load standard official Razorpay interactive overlay popup in window
      addCheckoutLog("Razorpay script loaded: Verifying Razorpay SDK presence in page context...");
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !(window as any).Razorpay) {
        addCheckoutLog("Error: Razorpay secure script could not be loaded into DOM. Check network connection or AdBlockers.");
        console.warn("Razorpay SDK not found in browser.");
        if (orderData.isSimulated) {
          console.log("Activating sandbox payment UI as requested by backend...");
          setSimulatedOrder({ ...orderData, isSimulated: true });
        } else {
          setUploadError(
            "Razorpay Secure Checkout could not be loaded. This typically happens if you are in a sandboxed iframe, your internet connection is restricted, or your browser is running an adblocker block list. Please open the school in a new browser tab or use the 'Manual UPI QR' tab to pay directly."
          );
        }
        setSubmittingOrder(false);
        return;
      }

      addCheckoutLog("Razorpay script loaded successfully.");

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Learn 2 Future",
        description: cart.length > 1 ? `${cart.length} Courses Bundle` : (cart[0]?.productTitle || "Digital Training Program"),
        order_id: orderData.id,
        handler: async function (paymentResponse: any) {
          addCheckoutLog("Razorpay standard success handler triggered!");
          await handlePaymentVerification(paymentResponse, orderData);
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
            addCheckoutLog("Razorpay popup closed by user action.");
            setSubmittingOrder(false);
          }
        }
      };

      try {
        addCheckoutLog("Razorpay popup opened attempt. Calling Razorpay.open()...");
        const rzpInstance = new (window as any).Razorpay(options);
        rzpInstance.open();

        // Set a timer to check if the popup successfully loaded in the DOM or was blocked
        setTimeout(() => {
          const container = document.querySelector(".razorpay-container") || document.querySelector("iframe[src*='checkout.razorpay.com']");
          if (!container) {
            addCheckoutLog("Warning: Razorpay iframe could not be detected in DOM. Popup is likely BLOCKED by the browser!");
            setPopupBlockerDetected(true);
          } else {
            addCheckoutLog("Razorpay popup opened: Container successfully mounted and detected in browser viewport.");
            setPopupBlockerDetected(false);
            setRazorpayOpenedSuccessfully(true);
          }
        }, 1500);

      } catch (innerRzpError: any) {
        addCheckoutLog(`Razorpay popup failed to open: ${innerRzpError.message || innerRzpError}`);
        console.warn("Razorpay dynamic launch blocked or failed.", innerRzpError);
        if (orderData.isSimulated) {
          console.log("Activating sandbox payment UI as requested by backend...");
          setSimulatedOrder({ ...orderData, isSimulated: true });
        } else {
          setUploadError(
            `Razorpay checkout interface could not be launched: ${innerRzpError.message || innerRzpError}. Please disable any adblocker extension or privacy block list, refresh the page, and try again.`
          );
        }
        setSubmittingOrder(false);
      }

    } catch (paymentErr: any) {
      console.error("Razorpay initiation error:", paymentErr);
      setUploadError(
        paymentErr.message || "An unexpected error occurred while communicating with the checkout gateway."
      );
      setSubmittingOrder(false);
    }
  };

  // Submit manual UPI payment request with validation assets Conforming to DB Security Rules
  const handleManualCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setUploadError("You must be logged in to compile the enrollment request.");
      return;
    }
    if (!checkoutForm.name.trim() || !checkoutForm.email.trim() || !checkoutForm.mobile.trim() || !checkoutForm.address.trim()) {
      setUploadError("Please fill out all required fields to register delivery parameters.");
      return;
    }
    if (!screenshotPreview) {
      setUploadError("Please upload your payment transaction proof screenshot.");
      return;
    }

    setManualSubmitting(true);
    setUploadProgress(10);
    setUploadError("");

    try {
      let downloadURL = "";

      try {
        if (screenshotFile && screenshotFile.size > 2 * 1024 * 1024) {
          throw new Error("File exceeds 2MB limit.");
        }
        
        const timestamp = Date.now();
        const extension = screenshotPreview.includes("image/png") ? "png" : "jpg";
        const storageRef = ref(storage, `orders/${user.uid}_${timestamp}_screenshot.${extension}`);
        
        setUploadProgress(0);
        
        const uploadTask = uploadBytesResumable(storageRef, screenshotFile as Blob);
        
        await Promise.race([
          new Promise<void>((resolvePromise, rejectPromise) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                const progress = Math.round(
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                setUploadProgress(progress);
              },
              (error) => {
                rejectPromise(error);
              },
              () => {
                resolvePromise();
              }
            );
          }),
          new Promise<void>((_, rejectPromise) => {
            setTimeout(() => {
              try {
                uploadTask.cancel();
              } catch (cancelErr) {
                console.warn("Could not cancel upload task after timeout:", cancelErr);
              }
              rejectPromise(new Error("Firebase Storage upload timed out. Bypassing upload and falling back to inline data URI representation."));
            }, 6000);
          })
        ]);
        
        downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setUploadProgress(100);
      } catch (storageError: any) {
        console.warn("Storage upload failed. Falling back to inline base64 representation:", storageError);
        if (storageError?.message?.includes("exceeds 1024") || storageError?.message?.includes("exceeds 2MB limit") || (screenshotFile && screenshotFile.size > 2 * 1024 * 1024)) {
          setUploadError("Upload failed: File exceeds 2MB limit.");
          setManualSubmitting(false);
          setUploadProgress(null);
          return;
        }
        // Fallback to inline preview if storage isn't accessible
        downloadURL = screenshotPreview;
        setUploadProgress(100);
      }

      if (!downloadURL) {
        throw new Error("Could not retrieve a valid download URL or base64 data for your screenshot.");
      }

      // Generate order ID conforming to rules
      const orderId = "ord_man_" + Date.now().toString().substring(3) + Math.random().toString(36).substring(3, 7);

      // Save order payload conforming to security rules perfectly
      const orderPayload: any = {
        name: checkoutForm.name,
        buyerName: checkoutForm.name,
        email: user.email || checkoutForm.email,
        telegram: checkoutForm.telegram || "N/A",
        telegramUsername: checkoutForm.telegram || "N/A",
        courseId: cart[0]?.productId || "multiple_items",
        courseName: cart.length > 1 ? `${cart.length} Courses Bundle` : (cart[0]?.productTitle || "Digital Training Program"),
        price: finalCost,
        originalPrice: cartSubtotal,
        discountApplied: discountAmount,
        couponCode: appliedCoupon || "None",
        screenshotUrl: downloadURL,
        proofImage: downloadURL,
        status: "Pending",
        userId: user.uid,
        paymentType: "UPI Manual QR Payment",
        createdAt: serverTimestamp(),
      };

      // Set document in Firestore "orders"
      await setDoc(doc(db, "orders", orderId), orderPayload);

      // Save details to purchase table or individual items list
      if (cart.length > 0) {
        for (const item of cart) {
          const purchaseId = "pur_man_" + Date.now().toString().substring(4) + Math.random().toString(36).substring(3, 7);
          const purchasePayload = {
            id: purchaseId,
            userId: user.uid,
            courseId: item.productId,
            courseName: item.productTitle,
            purchaseDate: serverTimestamp(),
            status: "Pending", // Frozen until admin approves screenshot
            price: Number(item.price),
            originalPrice: Number(item.price),
            discountApplied: 0,
            couponCode: appliedCoupon || "None"
          };
          await setDoc(doc(db, "userPurchases", purchaseId), purchasePayload);
        }
      }

      await clearCart();

      setCreatedOrderRef({
        id: orderId,
        email: checkoutForm.email,
        courseName: cart.length > 1 ? `${cart.length} Courses Bundle` : (cart[0]?.productTitle || "Digital Training Program"),
        status: "Pending"
      });

      // Track purchase if fbq exists
      try {
        if (typeof (window as any).fbq === "function") {
          (window as any).fbq("track", "Purchase", {
            value: Number(finalCost),
            currency: "INR",
            content_name: cart.length > 1 ? `${cart.length} Courses Bundle` : (cart[0]?.productTitle || "Digital Course"),
            content_ids: cart.map(item => item.productId),
            content_type: "product",
            order_id: orderId
          });
        }
      } catch (_) {}

      setCheckoutStep("success");
      setCurrentPage("thank-you", orderId);
      await logUserActivity("Manual Purchase Submitted", `Completed manual UPI checkout request for Order #${orderId}`);
    } catch (err: any) {
      console.error("Manual order submission failure:", err);
      setUploadError(err.message || "Manual order submission failed. Verification could not complete.");
    } finally {
      setManualSubmitting(false);
      setUploadProgress(null);
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
              <span className="text-[10px] font-mono tracking-widest text-[#999] uppercase">CART ITEMS ({cart.length}) &nbsp;•&nbsp; <span className="text-brand-gold">Click any card to view instant payment details</span></span>
              <div className="space-y-3.5">
                {cart.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedProductForPopup(item)}
                    className="bg-[#0b0b0b] border border-neutral-900 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center relative group hover:border-brand-gold/40 transition-colors cursor-pointer select-none"
                    title="Click card to view details and payment details"
                  >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCartQuantity(item.id, (item.quantity || 1) - 1);
                          }}
                          className="p-1 hover:bg-neutral-800 text-neutral-400 rounded transition-colors"
                          title="Reduce quantity by 1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-white font-bold">{item.quantity || 1}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCartQuantity(item.id, (item.quantity || 1) + 1);
                          }}
                          className="p-1 hover:bg-neutral-800 text-neutral-400 rounded transition-colors"
                          title="Increase quantity by 1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-extrabold text-neutral-200">₹{(Number(item.price) * (item.quantity || 1)).toLocaleString("en-IN")}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.id);
                          }}
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
          <div className="max-w-xl mx-auto bg-[#0b0b0b] border border-neutral-900 rounded-3xl p-6 sm:p-10 space-y-6 text-center relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-gold/5 blur-3xl rounded-full pointer-events-none" />
            
            {/* Payment Method Selector segment control */}
            <div className="grid grid-cols-2 p-1 bg-black rounded-2xl border border-neutral-900 text-center select-none max-w-md mx-auto mb-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("razorpay");
                  setUploadError("");
                }}
                className={`py-2.5 px-3.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold uppercase transition-all tracking-wider cursor-pointer ${
                  paymentMethod === "razorpay"
                    ? "bg-brand-gold text-black shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                ⚡ Instant Gateway
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("upi");
                  setUploadError("");
                }}
                className={`py-2.5 px-3.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold uppercase transition-all tracking-wider cursor-pointer ${
                  paymentMethod === "upi"
                    ? "bg-brand-gold text-black shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                📸 Manual UPI QR
              </button>
            </div>

            {paymentMethod === "razorpay" ? (
              <div className="space-y-6">
                {simulatedOrder ? (
                  /* SIMULATOR GATEWAY CONTROLS */
                  <div className="space-y-5 p-5 bg-brand-gold/5 border border-brand-gold/15 rounded-2xl relative overflow-hidden text-center animate-fadeIn">
                    <div className="absolute top-0 right-0 bg-brand-gold text-black text-[9px] font-mono uppercase tracking-widest font-extrabold px-3 py-1 rounded-bl-xl shadow-sm">
                      Sandbox Bypass
                    </div>
                    <div className="w-12 h-12 bg-brand-gold/15 border border-brand-gold/30 rounded-full flex items-center justify-center mx-auto text-brand-gold animate-bounce">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-sans font-bold text-white uppercase tracking-wider">Interactive Sandbox Simulation Active</h4>
                      <p className="text-[11px] text-neutral-350 leading-relaxed max-w-sm mx-auto">
                        Because you are testing inside a sandboxed preview environment, we have initialized a secure instant sandbox transaction (ID: <span className="font-mono text-brand-gold font-bold">{simulatedOrder.id}</span>).
                      </p>
                      <p className="text-[10.5px] text-brand-gold font-semibold leading-relaxed">
                        Press below to instantly simulate a successful checkout and unlock your selected study courses!
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={submittingOrder}
                        onClick={() => triggerSimulatedSuccess(simulatedOrder)}
                        className="w-full bg-brand-gold hover:bg-[#ffd34d] disabled:opacity-55 text-black font-sans font-extrabold text-[10.5px] uppercase tracking-widest py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {submittingOrder ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Simulating Clearance...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Authorize and Complete Simulated order</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* STANDARD AUTOMATED GATEWAY LOADER */
                  <div className="space-y-6">
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

                    {/* Pop-up Blocker / Sandboxed Iframe Detection Warning & Fallback Trigger */}
                    {createdOrderData && (
                      <div className="p-4 bg-amber-950/20 border border-amber-800/40 text-amber-200 rounded-2xl text-left text-xs space-y-3 animate-fadeIn">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold text-amber-300 block">Browser Popup Blocker / Sandbox Iframe Detected?</span>
                            <p className="text-[11px] text-neutral-350 leading-relaxed">
                              If the secure payment popup did not open automatically, your browser or iframe context is protecting/blocking overlays. 
                              Click the button below to force launch the payment safely using a direct synchronous gesture.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleFallbackClick}
                          className="w-full bg-brand-gold hover:bg-[#ffd34d] text-black font-sans font-extrabold text-[11px] uppercase tracking-widest py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow active:scale-95 cursor-pointer font-bold"
                        >
                          <span>👉 Click here to open payment window</span>
                          <CreditCard className="w-4 h-4 text-black" />
                        </button>
                      </div>
                    )}

                    {/* Live Transaction Audit Log Panel */}
                    <div className="border border-neutral-900 bg-[#070707] rounded-2xl p-4 text-left space-y-2">
                      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 font-bold">Live Transaction Audit Log</span>
                        <span className="text-[9px] font-mono text-brand-gold font-bold bg-brand-gold/10 px-2 py-0.5 rounded-full">
                          {razorpayOpenedSuccessfully ? "Opened" : popupBlockerDetected ? "Blocked" : "Initiating"}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-neutral-400 space-y-1 max-h-32 overflow-y-auto custom-scrollbar leading-relaxed">
                        {checkoutLogs.length === 0 ? (
                          <p className="text-neutral-600 italic">No activity recorded yet...</p>
                        ) : (
                          checkoutLogs.map((log, index) => (
                            <p key={index} className={log.includes("Warning") || log.includes("Error") ? "text-red-400 font-semibold" : log.includes("successfully") || log.includes("verified successfully") ? "text-green-400 font-semibold" : ""}>
                              {log}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="space-y-3.5 max-w-md mx-auto text-left animate-fadeIn">
                    <div className="p-4 bg-red-950/45 border border-red-900 text-red-200 rounded-2xl text-xs font-mono flex flex-col gap-2.5">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                        <span className="break-words font-semibold">{uploadError}</span>
                      </div>
                      
                      <div className="border-t border-red-900/40 pt-2.5 mt-1 leading-relaxed space-y-2">
                        <span className="font-sans font-extrabold text-brand-gold text-[10.5px] uppercase tracking-wider block">💡 Sandbox Iframe / Config Block detected:</span>
                        <p className="text-[10px] text-neutral-355 leading-relaxed">
                          Because the application is rendered inside a secure sandboxed iframe or the Razorpay API credentials are not set up in the Admin Settings yet, the automated checkout popup may be blocked.
                        </p>
                        <p className="text-[10px] text-brand-gold/90 font-bold">
                          You can instantly submit your order by using our direct scan-to-pay UPI transfer below!
                        </p>
                        
                        <div className="pt-1.5 pb-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentMethod("upi");
                              setUploadError("");
                            }}
                            className="w-full bg-brand-gold hover:bg-[#ffd34d] text-black font-sans font-extrabold text-[10.5px] uppercase tracking-widest py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer"
                          >
                            <span>📸 Pay Instantly via UPI QR</span>
                            <QrCode className="w-4 h-4 text-black" />
                          </button>
                        </div>
                      </div>
                    </div>
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
                    className="w-full sm:w-1/2 bg-brand-gold hover:bg-[#ffd34d] disabled:opacity-50 text-black font-mono font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow cursor-pointer"
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
            ) : (
              /* MANUAL UPI QR TRANSFER SCREEN */
              <div className="space-y-5 max-w-lg mx-auto text-left">
                <div className="text-center space-y-1">
                  <span className="text-[9px] font-mono tracking-widest text-[#999] uppercase bg-neutral-900 px-3 py-1 rounded-full border border-neutral-850">UPI Settlement Protocol</span>
                  <h3 className="text-base sm:text-lg font-display font-extrabold text-white mt-2">Scan & Submit Proof</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-black/60 border border-neutral-850 p-4 rounded-2xl">
                  {/* QR code */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-brand-border/60 shadow-sm text-center">
                    {globalSettings.upiQrCode ? (
                      <img 
                        src={globalSettings.upiQrCode} 
                        alt="UPI QR Code" 
                        className="w-28 h-28 object-contain rounded-lg border border-neutral-100 dark:border-brand-border/80 mb-2"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-28 h-28 flex flex-col items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-400 p-2 text-center mb-2 bg-neutral-50 dark:bg-neutral-900/40">
                        <QrCode className="w-6 h-6 text-neutral-400 dark:text-neutral-600 mb-1 animate-pulse" />
                        <span className="text-[8px] uppercase tracking-wider font-mono font-semibold">QR Code Not Set</span>
                      </div>
                    )}
                    <p className="text-[8px] font-mono text-neutral-400 font-semibold uppercase tracking-wider">Scan to Pay Instantly</p>
                  </div>

                  {/* UPI particulars */}
                  <div className="space-y-2 text-xs">
                    <div className="bg-neutral-100/10 dark:bg-neutral-900/70 p-2.5 rounded-xl border border-neutral-850 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="block text-[8px] font-mono font-bold text-neutral-450 uppercase tracking-widest leading-none mb-1 text-neutral-400">UPI ID / VPA</span>
                        <span className="font-mono text-[10.5px] text-brand-gold font-bold break-all select-all">{globalSettings.upiId || "uniquesolutions@ybl"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUPI}
                        className="bg-neutral-800 hover:bg-neutral-750 p-2 rounded-lg text-neutral-400 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer ml-1.5 shrink-0"
                        title="Copy UPI Address"
                      >
                        {copySuccess ? <span className="text-[9px] font-bold text-green-500 font-sans">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="p-2.5 bg-neutral-900/30 rounded-xl border border-neutral-900 flex flex-col">
                      <span className="text-[8px] font-mono font-bold text-neutral-450 uppercase tracking-widest mb-1 text-neutral-450 text-neutral-400">Account Name</span>
                      <span className="font-semibold text-neutral-200 text-xs leading-none">{globalSettings.upiAccountName || "Unique Solutions"}</span>
                    </div>

                    <div className="p-2.5 bg-neutral-900/30 rounded-xl border border-neutral-900 flex flex-col">
                      <span className="text-[8px] font-mono font-bold text-neutral-450 uppercase tracking-widest mb-1 text-neutral-450 text-neutral-400">Amount Payable</span>
                      <span className="font-extrabold text-brand-gold text-sm leading-none">₹{finalCost.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Form to submit manual detail */}
                <form onSubmit={handleManualCheckoutSubmit} className="space-y-4">
                  {/* File Upload Zone */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-neutral-400 uppercase tracking-widest font-mono font-bold">
                      Attach UPI Transaction Screenshot *
                    </label>

                    {screenshotPreview ? (
                      <div className="relative border border-brand-border bg-black/50 rounded-2xl max-h-40 overflow-hidden flex items-center justify-center p-2 group select-none">
                        <img 
                          src={screenshotPreview} 
                          alt="transaction-proof" 
                          className="max-h-36 max-w-full rounded-xl object-contain shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshotFile(null);
                            setScreenshotPreview("");
                          }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border border-dashed border-neutral-800 rounded-2xl p-5 text-center cursor-pointer hover:border-brand-gold/60 transition-colors bg-neutral-950/40 relative group">
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-6 h-6 text-neutral-500 group-hover:text-brand-gold transition-colors mx-auto mb-1.5" />
                        <span className="block text-xs font-medium text-neutral-300">Click or Drag screenshot file here</span>
                        <span className="block text-[9px] text-neutral-500 font-mono mt-1">Accepts images up to 2MB</span>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <div className="p-3 bg-red-950/45 border border-red-900/60 text-red-400 rounded-xl text-xs font-mono flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {uploadProgress !== null && (
                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-neutral-450 uppercase">Uploading Proof Attachment:</span>
                        <span className="text-neutral-300 font-bold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-1 overflow-hidden">
                        <div className="bg-brand-gold h-1 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-between gap-4">
                    <button 
                      type="button"
                      onClick={() => setCheckoutStep("details")}
                      className="bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 px-5 py-3 rounded-xl text-xs font-mono uppercase font-bold text-neutral-300 transition-colors cursor-pointer"
                    >
                      Go Back
                    </button>
                    <button 
                      type="submit"
                      disabled={manualSubmitting || !screenshotPreview}
                      className="flex-1 bg-brand-gold hover:bg-[#ffd34d] disabled:opacity-45 text-black font-mono font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                    >
                      {manualSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-black" />
                          <span>Submit Manual Verification</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
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

      {/* Click-to-pay Product Details Popup Modal */}
      {selectedProductForPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn select-none">
          <div className="bg-[#0b0b0b] border border-neutral-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full relative space-y-5 shadow-2xl animate-scaleIn text-left">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-neutral-900 pb-3">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-brand-gold uppercase">Product Summary</span>
                <h3 className="text-base font-display font-extrabold text-white mt-1">Payment Details</h3>
              </div>
              <button 
                onClick={() => setSelectedProductForPopup(null)}
                className="text-neutral-400 hover:text-white p-1.5 bg-neutral-950 border border-neutral-850 rounded-xl transition-all cursor-pointer"
                title="Close overlay"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Basic Details */}
            <div className="flex gap-3.5 items-center bg-black/50 border border-neutral-850 p-3.5 rounded-2xl">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800">
                <img src={selectedProductForPopup.productImage} alt={selectedProductForPopup.productTitle} className="w-full h-full object-cover animate-pulse" referrerPolicy="no-referrer" />
              </div>
              <div className="min-w-0">
                <span className="inline-block text-[8px] font-mono tracking-wide text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full border border-brand-gold/10 uppercase">
                  {selectedProductForPopup.productCategory || "Online Course"}
                </span>
                <h4 className="text-xs font-bold text-white truncate max-w-[180px] mt-1">{selectedProductForPopup.productTitle}</h4>
                <p className="text-[10px] text-neutral-450 mt-1 font-mono">Rate: ₹{Number(selectedProductForPopup.price).toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Mobile number section */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[9px] text-neutral-400 uppercase tracking-widest font-mono font-bold">
                  Student Mobile Number *
                </label>
                {checkoutForm.mobile && checkoutForm.mobile.length === 10 && (
                  <span className="text-[8px] font-mono text-emerald-400 uppercase font-bold">✓ Valid Ready</span>
                )}
              </div>
              <input 
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={checkoutForm.mobile}
                onChange={(e) => setCheckoutForm({...checkoutForm, mobile: e.target.value})}
                className="bg-black border border-neutral-850 rounded-xl px-3.5 py-3 text-xs font-mono outline-none focus:border-brand-gold w-full text-white tracking-widest"
              />
              <p className="text-[8px] text-neutral-500 font-mono leading-normal">
                Course dispatches and student registration credentials will be bound to this telephone contact.
              </p>
            </div>

            {/* Payment Details block */}
            <div className="bg-neutral-950 border border-neutral-900 p-3.5 rounded-xl space-y-2 font-mono text-[10.5px]">
              <div className="flex justify-between">
                <span className="text-neutral-500 uppercase">Per Item Rate:</span>
                <span className="text-neutral-300">₹{Number(selectedProductForPopup.price).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-1.5 mb-1.5">
                <span className="text-neutral-500 uppercase">Quantity:</span>
                <span className="text-neutral-300">{selectedProductForPopup.quantity || 1} Courses</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-yellow-500 text-[10px]">
                  <span className="uppercase">Coupon code:</span>
                  <span className="font-bold">{appliedCoupon} (-₹{Math.round(discountAmount).toLocaleString("en-IN")})</span>
                </div>
              )}
              <div className="flex justify-between text-brand-gold font-bold">
                <span className="uppercase">Final Payable:</span>
                <span className="text-xs font-extrabold">
                  ₹{Math.max(0, (Number(selectedProductForPopup.price) * (selectedProductForPopup.quantity || 1)) - (appliedCoupon ? Math.round(discountAmount) : 0)).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Trigger Checkout directly */}
            <div className="pt-1.5">
              <button
                type="button"
                onClick={() => {
                  if (!checkoutForm.mobile.trim()) {
                    alert("Please specify a contact mobile number to proceed to instant checkout!");
                    return;
                  }
                  if (checkoutForm.mobile.trim().length < 10) {
                    alert("Please input a valid 10-digit contact phone number!");
                    return;
                  }
                  // Prefill coordinates and route directly to payment options with automatic launching
                  setSelectedProductForPopup(null);
                  setCheckoutStep("payment");
                }}
                className="w-full bg-brand-gold hover:bg-[#ffd34d] text-black font-mono font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
              >
                <CreditCard className="w-4 h-4 text-black animate-pulse" />
                <span>Pay via Instant Gateway</span>
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );
};
