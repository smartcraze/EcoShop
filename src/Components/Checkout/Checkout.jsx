import React, { useState, useCallback, useMemo } from "react";
import "../FinalPrice/FinalPrice.css";
import { useCart, useAlert } from "../../context";
import { useNavigate } from "react-router-dom";

export const Checkout = () => {
  const {
    cartState: { cart, deliveryCharge = 0 },
    cartDispatch
  } = useCart();

  const { setAlert } = useAlert();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Memoized calculations
  const totalItemPrice = useMemo(() => 
    cart.reduce((prev, curr) => prev + Number(curr.newPrice) * curr.itemCount, 0),
    [cart]
  );

  const originalPrice = useMemo(() => 
    cart.reduce((prev, curr) => prev + Number(curr.oldPrice) * curr.itemCount, 0),
    [cart]
  );

  const discountedPrice = originalPrice - totalItemPrice;
  const totalAmount = Math.round(Math.abs(originalPrice - discountedPrice + deliveryCharge));

  // Script loading function
  const loadScript = useCallback((src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  // Razorpay payment handler
  const displayRazorpay = useCallback(async () => {
    if (cart.length === 0) {
      setAlert({
        open: true,
        message: "Your cart is empty",
        type: "error"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Load Razorpay script
      const response = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

      if (!response) {
        throw new Error("Razorpay SDK failed to load");
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY || "rzp_test_VSdp7X3K39GwBK",
        amount: totalAmount * 100,
        currency: "INR",
        name: "The Organic Hub",
        description: "Thank you for shopping with us",
        image: "https://example.com/logo.png",
        
        handler: async (response) => {
          try {
            // Process payment through mock backend
            const paymentResponse = await fetch('/api/payments/process', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id,
                amount: totalAmount,
                items: cart
              })
            });

            const result = await paymentResponse.json();

            if (result.status === 'success') {
              // Clear cart and navigate to order confirmation
              cartDispatch({ type: "CLEAR_CART" });
              navigate("/order", { 
                state: { 
                  orderId: result.orderId,
                  paymentId: result.paymentId 
                } 
              });
              
              setAlert({
                open: true,
                message: "Payment successful!",
                type: "success"
              });
            } else {
              throw new Error("Payment processing failed");
            }
          } catch (error) {
            setAlert({
              open: true,
              message: error.message || "Payment processing error",
              type: "error"
            });
          }
        },
        
        prefill: {
          name: "",
          email: "",
          contact: ""
        },
        
        notes: {
          address: "Delivery Address"
        },
        
        theme: {
          color: "#3399cc"
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', (response) => {
        setAlert({
          open: true,
          message: `Payment failed: ${response.error.description}`,
          type: "error"
        });
      });

      paymentObject.open();
    } catch (error) {
      setAlert({
        open: true,
        message: error.message || "Something went wrong",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    cart, 
    loadScript, 
    setAlert, 
    cartDispatch, 
    navigate, 
    totalAmount
  ]);

  return (
    <div className="total-price padding-all-16 align-self">
      <h3 className="cart-title">Price Details</h3>
      <div className="price-distribution d-flex direction-column gap">
        <div className="items-purchased d-flex align-center">
          <p>Price ({cart.length} items)</p>
          <p className="mg-left">Rs. {originalPrice.toFixed(2)}</p>
        </div>
        <div className="discount-rate d-flex align-center">
          <p>Discount</p>
          <p className="mg-left">- Rs. {discountedPrice.toFixed(2)}</p>
        </div>
        <div className="delivery-charge d-flex align-center">
          <p>Delivery Charges</p>
          <p className="mg-left">Rs. {deliveryCharge.toFixed(2)}</p>
        </div>
      </div>
      <div className="total-amount d-flex align-center">
        <p>TOTAL AMOUNT </p>
        <p className="mg-left">Rs. {totalAmount.toFixed(2)}</p>
      </div>
      <p className="discount-text">
        You will save Rs. {discountedPrice.toFixed(2)} on this order
      </p>
      <button 
        className="button btn-primary cursor btn-width" 
        onClick={displayRazorpay}
        disabled={isLoading || cart.length === 0}
      >
        {isLoading ? "Processing..." : "Checkout"}
      </button>
    </div>
  );
};