'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import axios from 'axios';
import { Check } from 'lucide-react';

type Plan = 'free' | 'pro' | 'enterprise';

interface PlanOption {
  id: Plan;
  name: string;
  description: string;
  price: string;
  features: string[];
  color: string;
}

const plans: PlanOption[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for startups',
    price: '$0',
    features: [
      '5 team members',
      '100 assessments/month',
      'Basic reports',
      'Community support',
    ],
    color: 'border-gray-300',
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'For growing teams',
    price: '$299',
    features: [
      '50 team members',
      'Unlimited assessments',
      'Advanced analytics',
      'White-label option',
      'Priority email support',
      'Custom branding',
    ],
    color: 'border-blue-500',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 'Custom',
    features: [
      'Unlimited team members',
      'Unlimited assessments',
      'Full white-label',
      'SSO/SAML integration',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    color: 'border-purple-500',
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan>('pro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'plan' | 'details'>('plan');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const idToken = await userCredential.user.getIdToken();

      // Create tenant and subscription via backend. Non-fatal: the account
      // already exists in Firebase, so a backend hiccup shouldn't block
      // onboarding (the API provisions the tenant lazily on first call).
      try {
        await axios.post(
          'http://localhost:3000/api/auth/register',
          { email, plan: selectedPlan, companyName },
          { headers: { Authorization: `Bearer ${idToken}` } },
        );
      } catch {
        // continue to onboarding regardless
      }

      // Redirect based on plan
      if (selectedPlan === 'enterprise') {
        router.push('/onboarding/enterprise-setup');
      } else {
        router.push('/onboarding/complete');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Signup failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">AssessOS</h1>
          <p className="text-gray-600 mt-1">Leadership Assessment Platform</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {step === 'plan' ? (
          <>
            {/* Plan Selection */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Choose Your Plan
              </h2>
              <p className="text-gray-600">
                Select the right plan for your organization
              </p>
            </div>

            <div className="grid grid-cols-3 gap-8 mb-8">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`border-2 rounded-lg p-8 text-left transition ${
                    selectedPlan === plan.id
                      ? `${plan.color} bg-brand-50 border-2 border-blue-500`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-slate-900">
                      {plan.price}
                    </span>
                    {plan.id !== 'enterprise' && (
                      <span className="text-gray-600">/month</span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {selectedPlan === plan.id && (
                    <div className="w-full py-2 bg-brand-600 text-white rounded-lg font-medium text-sm text-center">
                      Selected
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep('details')}
                className="px-8 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-medium"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Details Form */}
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Create Your Account
              </h2>
              <p className="text-gray-600 mb-8">
                Plan selected: <strong>{plans.find(p => p.id === selectedPlan)?.name}</strong>
              </p>

              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition font-medium"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-gray-600 text-sm mt-6">
                Already have an account?{' '}
                <a href="/login" className="text-brand-600 hover:underline">
                  Sign in
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
