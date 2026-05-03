import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSubscriptionInfo, createCheckoutSession, getBillingPortal } from '../api/jobsApi';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import { Check, Star, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Pricing = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscriptionInfo,
    enabled: isAuthenticated,
  });

  const currentPlan = subData?.data?.plan || 'free';

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      toast.error('Please login to subscribe');
      return;
    }
    if (user.role !== 'employer') {
      toast.error('Only employers can subscribe to plans');
      return;
    }

    try {
      const res = await createCheckoutSession(plan);
      if (res.data.sessionUrl) {
        window.location.href = res.data.sessionUrl;
      }
    } catch (err) {
      toast.error('Unable to start checkout');
    }
  };

  const plans = [
    {
      name: 'free',
      label: 'Free',
      price: '0',
      icon: Zap,
      features: [
        '1 active job post',
        'Basic job listing',
        'No analytics',
        'No AI match scores',
        'No featured listings'
      ],
      cta: 'Get Started',
      variant: 'outline'
    },
    {
      name: 'pro',
      label: 'Pro',
      price: '29',
      icon: Star,
      popular: true,
      features: [
        'Unlimited job posts',
        'Full analytics dashboard',
        'AI match scores on applicants',
        '3 featured listings / month',
        'Email support'
      ],
      cta: 'Start Pro',
      variant: 'primary'
    },
    {
      name: 'enterprise',
      label: 'Enterprise',
      price: '99',
      icon: ShieldCheck,
      features: [
        'Everything in Pro',
        '10 featured listings / month',
        'CSV export of applicants',
        'Company profile page',
        'Priority support badge'
      ],
      cta: 'Start Enterprise',
      variant: 'outline'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <section className="py-20 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block">Pricing Plans</span>
          <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
            Invest in your <span className="text-primary">Hiring</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the right plan for your company. Publish unlimited jobs, feature listings, and manage billing through Stripe.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative bg-white dark:bg-gray-900 rounded-3xl p-8 border-2 transition-all hover:shadow-2xl ${
                plan.popular 
                ? 'border-primary shadow-xl scale-105 z-10' 
                : 'border-gray-100 dark:border-gray-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                  plan.popular ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                  <plan.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-tight">{plan.label}</h3>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">${plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-600 dark:text-gray-400">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.variant} 
                className="w-full h-12 text-lg font-bold"
                onClick={() => handleSubscribe(plan.name)}
                disabled={currentPlan === plan.name}
              >
                {currentPlan === plan.name ? 'Current Plan' : plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Pricing;
