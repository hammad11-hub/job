import express from "express";
import Stripe from "stripe";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { PLANS } from "../config/plans.js";
import { requireUserId } from "../middleware/auth.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-11-15",
});

export function createPaymentsRouter(transporter) {
  const router = express.Router();
  router.use(requireUserId);

  router.post("/create-checkout-session", async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Missing auth token" });
      }
      const plan = req.body?.plan === "enterprise" ? "enterprise" : "pro";
      const priceId = plan === "pro" ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_ENTERPRISE_PRICE_ID;
      if (!priceId) {
        return res.status(500).json({ message: "Price ID not configured" });
      }
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || user.email,
        });
        user.stripeCustomerId = customer.id;
        await user.save();
      }

      const session = await stripe.checkout.sessions.create({
        customer: user.stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard/employer-dashboard.html?payment=success`,
        cancel_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/pricing.html?payment=cancelled`,
        metadata: {
          userId: String(user._id),
          plan,
        },
      });

      return res.json({ sessionUrl: session.url });
    } catch (err) {
      console.error("Checkout session error:", err);
      return res.status(500).json({ error: err.message || "Unable to create checkout session" });
    }
  });

  router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ message: "Missing Stripe signature" });
    }
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET || "");
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err.message);
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.metadata?.userId;
          const plan = session.metadata?.plan;
          if (mongoose.Types.ObjectId.isValid(userId) && plan) {
            const user = await User.findById(userId);
            if (user) {
              user.plan = plan;
              user.stripeSubscriptionId = session.subscription || user.stripeSubscriptionId;
              user.planExpiresAt = null;
              user.paymentStatus = "active";
              user.featuredJobsRemaining = plan === "enterprise" ? 10 : 3;
              await user.save();
              if (transporter) {
                await transporter.sendMail({
                  from: process.env.EMAIL_FROM || `"Job Tracker" <no-reply@jobtracker.local>`,
                  to: user.email,
                  subject: `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} subscription is active`,
                  text: `Thank you for subscribing to the ${plan} plan. Your subscription is now active.`,
                  html: `<p>Thank you for subscribing to the <strong>${plan}</strong> plan. Your subscription is now active.</p>`,
                });
              }
            }
          }
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object;
          const user = await User.findOne({ stripeSubscriptionId: subscription.id });
          if (user) {
            if (subscription.status === "past_due") {
              user.paymentStatus = "past_due";
              await user.save();
              if (transporter) {
                await transporter.sendMail({
                  from: process.env.EMAIL_FROM || `"Job Tracker" <no-reply@jobtracker.local>`,
                  to: user.email,
                  subject: "Payment issue with your Job Tracker subscription",
                  text: `We were unable to process the payment for your subscription. Please update your payment method in the billing portal to avoid interruption.`,
                  html: `<p>We were unable to process the payment for your subscription. Please update your payment method in the billing portal to avoid interruption.</p>`,
                });
              }
            }
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const user = await User.findOne({ stripeSubscriptionId: subscription.id });
          if (user) {
            user.plan = "free";
            user.stripeSubscriptionId = null;
            user.featuredJobsRemaining = 0;
            user.planExpiresAt = null;
            user.paymentStatus = "cancelled";
            await user.save();
            if (transporter) {
              await transporter.sendMail({
                from: process.env.EMAIL_FROM || `"Job Tracker" <no-reply@jobtracker.local>`,
                to: user.email,
                subject: "Your subscription has been cancelled",
                text: `Your Job Tracker subscription has been cancelled and your account has been downgraded to the Free plan.`,
                html: `<p>Your Job Tracker subscription has been cancelled and your account has been downgraded to the Free plan.</p>`,
              });
            }
          }
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object;
          const customerId = invoice.customer;
          const user = await User.findOne({ stripeCustomerId: customerId });
          if (user && transporter) {
            await transporter.sendMail({
              from: process.env.EMAIL_FROM || `"Job Tracker" <no-reply@jobtracker.local>`,
              to: user.email,
              subject: "Payment failed for your Job Tracker subscription",
              text: `A recent payment for your Job Tracker subscription failed. Please update your payment method in the billing portal.`,
              html: `<p>A recent payment for your Job Tracker subscription failed. Please update your payment method in the billing portal.</p>`,
            });
          }
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error("Error handling Stripe webhook event:", err);
      return res.status(500).json({ message: "Webhook processing failed" });
    }

    return res.status(200).json({ received: true });
  });

  router.post("/cancel-subscription", async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Missing auth token" });
      }
      const user = await User.findById(req.userId);
      if (!user || !user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }
      await stripe.subscriptions.del(user.stripeSubscriptionId);
      user.plan = "free";
      user.stripeSubscriptionId = null;
      user.featuredJobsRemaining = 0;
      user.planExpiresAt = null;
      user.paymentStatus = "cancelled";
      await user.save();
      return res.json({ message: "Subscription cancelled" });
    } catch (err) {
      console.error("Cancel subscription error:", err);
      return res.status(500).json({ error: err.message || "Unable to cancel subscription" });
    }
  });

  router.get("/subscription", async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Missing auth token" });
      }
      const user = await User.findById(req.userId).lean();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({
        plan: user.plan || "free",
        stripeSubscriptionId: user.stripeSubscriptionId || null,
        planExpiresAt: user.planExpiresAt || null,
        featuredJobsRemaining: user.featuredJobsRemaining || 0,
        limits: PLANS[user.plan || "free"],
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.post("/portal-session", async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Missing auth token" });
      }
      const user = await User.findById(req.userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer record found" });
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard/employer-dashboard.html`,
      });
      return res.json({ url: session.url });
    } catch (err) {
      console.error("Portal session error:", err);
      return res.status(500).json({ error: err.message || "Unable to create billing portal session" });
    }
  });

  return router;
}
