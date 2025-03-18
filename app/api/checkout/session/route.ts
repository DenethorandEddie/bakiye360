import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Route segment config for API route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("Checkout endpoint received request");
    
    // Check if Stripe API key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe API key is missing");
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }
    
    console.log("Creating Stripe instance with API key");
    
    // Initialize Stripe client with minimal configuration
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Authenticate user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("User not authenticated", authError);
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    console.log("User authenticated:", user.email);
    
    // Get user settings from Supabase
    const { data: userSettings, error: fetchError } = await supabase
      .from("user_settings")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();
    
    if (fetchError) {
      console.error("Error fetching user settings:", fetchError.message);
      return NextResponse.json(
        { error: "Error fetching user data" },
        { status: 500 }
      );
    }
    
    console.log("User settings retrieved:", userSettings);
    
    // Create or get customer ID
    let customerId = userSettings?.stripe_customer_id;
    
    if (!customerId) {
      console.log("Creating new Stripe customer");
      
      try {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id
          }
        });
        
        customerId = customer.id;
        console.log("New Stripe customer created:", customerId);
        
        // Update user settings with customer ID
        const { error: updateError } = await supabase
          .from("user_settings")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("Error updating user with customer ID:", updateError.message);
          return NextResponse.json(
            { error: "Error updating user data" },
            { status: 500 }
          );
        }
        
        console.log("User settings updated with customer ID");
      } catch (error: any) {
        console.error("Error creating Stripe customer:", error.message);
        return NextResponse.json(
          { error: "Error creating customer" },
          { status: 500 }
        );
      }
    } else {
      console.log("Using existing Stripe customer:", customerId);
    }
    
    // Verify price ID is configured
    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID) {
      console.error("Stripe price ID is missing");
      return NextResponse.json(
        { error: "Payment pricing not configured" },
        { status: 500 }
      );
    }
    
    console.log("Creating checkout session with price:", process.env.NEXT_PUBLIC_STRIPE_PRICE_ID);
    
    // Create Stripe checkout session with minimal parameters
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      });
      
      console.log("Checkout session created successfully:", session.id);
      
      if (!session.url) {
        console.error("Checkout session created but URL is missing");
        return NextResponse.json(
          { error: "Failed to generate checkout URL" },
          { status: 500 }
        );
      }
      
      console.log("Returning checkout URL:", session.url);
      return NextResponse.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error.message, error);
      
      return NextResponse.json(
        { 
          error: "Failed to create checkout session",
          details: error.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Unexpected error in checkout endpoint:", error.message);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 