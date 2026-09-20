import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Zap,
  Clock,
  Check,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Server,
  Code2
} from 'lucide-react';
import { AmcTier, AmcPlanDetails } from '../../types';

export interface AmcCalculatorProps {
  selectedTier: AmcTier;
  onTierChange: (details: AmcPlanDetails) => void;
  devSubtotalTaxable: number;
}

interface TierDefinition {
  id: AmcTier;
  name: string;
  tagline: string;
  badge?: string;
  annualFee: number;
  quarterlyFee: number;
  slaHours: number;
  monthlyDevHours: number;
  colorScheme: {
    border: string;
    activeBorder: string;
    bgActive: string;
    badgeBg: string;
    badgeText: string;
    accentText: string;
    accentGradient: string;
  };
  highlights: string[];
  features: string[];
}

const AMC_TIERS: TierDefinition[] = [
  {
    id: 'bronze',
    name: 'Bronze Level',
    tagline: 'Essential Site & Infrastructure Health',
    annualFee: 29999,
    quarterlyFee: 8500, // 34,000/yr if quarterly
    slaHours: 48,
    monthlyDevHours: 3,
    colorScheme: {
      border: 'border-amber-900/40',
      activeBorder: 'border-amber-500 ring-1 ring-amber-500/80',
      bgActive: 'bg-amber-950/30',
      badgeBg: 'bg-amber-950/80',
      badgeText: 'text-amber-300 border-amber-700/50',
      accentText: 'text-amber-400',
      accentGradient: 'from-amber-600 to-amber-800'
    },
    highlights: ['48h Bug Fix SLA', '3 Dev Hours/Mo', 'Weekly Cloud Backups'],
    features: [
      '99.5% Uptime Monitoring & Heartbeat Alerts',
      'Monthly Security & Dependency Patch Updates',
      'Automated Weekly Encrypted Cloud Backups',
      'Standard 48-Hour Technical Issue Turnaround',
      '3 Hours / Month for Content & Layout Tweaks',
      'SSL Certificate & Domain Health Auto-Renewals'
    ]
  },
  {
    id: 'silver',
    name: 'Silver Level',
    tagline: 'Professional Business Care & Optimization',
    badge: 'Most Popular',
    annualFee: 59999,
    quarterlyFee: 16999, // 67,996/yr if quarterly
    slaHours: 12,
    monthlyDevHours: 10,
    colorScheme: {
      border: 'border-slate-700',
      activeBorder: 'border-cyan-400 ring-2 ring-cyan-500/50',
      bgActive: 'bg-cyan-950/30',
      badgeBg: 'bg-cyan-500 text-slate-950 font-black',
      badgeText: 'text-slate-950',
      accentText: 'text-cyan-400',
      accentGradient: 'from-cyan-500 to-blue-600'
    },
    highlights: ['12h Priority SLA', '10 Dev Hours/Mo', 'Daily Database Backups'],
    features: [
      '99.9% High Availability SLA Guarantee',
      'Bi-Weekly Proactive Vulnerability Scanning',
      'Daily Automated Database & File Cloud Snapshots',
      '12-Hour Priority SLA Resolution Window',
      '10 Hours / Month for Feature Additions & Code Updates',
      'Database Indexing, Query Optimization & Page Speed Tuning',
      'Third-Party Payment & SMS API Break-Fix Support'
    ]
  },
  {
    id: 'gold',
    name: 'Gold Level',
    tagline: 'Enterprise 24/7 VIP Mission-Critical',
    badge: 'Enterprise VIP',
    annualFee: 99999,
    quarterlyFee: 27999, // 111,996/yr if quarterly
    slaHours: 2,
    monthlyDevHours: 25,
    colorScheme: {
      border: 'border-yellow-700/50',
      activeBorder: 'border-yellow-400 ring-2 ring-yellow-400/70',
      bgActive: 'bg-yellow-950/25',
      badgeBg: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black',
      badgeText: 'text-slate-950',
      accentText: 'text-yellow-400',
      accentGradient: 'from-amber-400 via-yellow-500 to-amber-600'
    },
    highlights: ['2h Emergency SLA', '25 Dev Hours/Mo', '24/7 On-Call Lead'],
    features: [
      '99.99% Enterprise Multi-Zone High Uptime SLA',
      '24/7 Dedicated Lead Tech Engineer on Direct WhatsApp/Phone',
      '2-Hour Critical Production Emergency Response SLA',
      'Real-Time Continuous Backup Replication & Instant Disaster Recovery',
      '25 Hours / Month Dedicated Development Sprint Time',
      'Quarterly Penetration Testing, Security Audits & Architecture Reviews',
      'Load Testing, Redis Cache Fine-Tuning & Scalability Scaling'
    ]
  }
];

export const AmcCalculator: React.FC<AmcCalculatorProps> = ({
  selectedTier,
  onTierChange,
  devSubtotalTaxable
}) => {
  const [tier, setTier] = useState<AmcTier>(() => {
    if (selectedTier === 'none') return 'none';
    if (selectedTier === 'bronze' || selectedTier === 'silver' || selectedTier === 'gold') {
      return selectedTier;
    }
    return 'silver'; // default recommended
  });

  const [billingCycle, setBillingCycle] = useState<'annual' | 'quarterly'>('annual');
  const [isAppendedToTotal, setIsAppendedToTotal] = useState<boolean>(true);
  const [additionalHours, setAdditionalHours] = useState<number>(0); // additional dev hours at ₹1,500/hr

  // Calculate current AMC pricing
  const currentTierDef = AMC_TIERS.find((t) => t.id === tier);

  const calculateAmcPlan = (
    chosenTier: AmcTier,
    cycle: 'annual' | 'quarterly',
    appended: boolean,
    extraHours: number
  ): AmcPlanDetails => {
    if (chosenTier === 'none') {
      return {
        tier: 'none',
        tierName: 'No AMC (Self Managed)',
        annualFee: 0,
        gstPercent: 18,
        gstAmount: 0,
        totalAmount: 0,
        billingCycle: cycle,
        slaResponseHours: 0,
        monthlyDevHours: 0,
        features: [
          'Standard 30-day post-launch critical bug warranty only',
          'Subsequent enhancements & maintenance billed on hourly rate card (₹1,500/hr)',
          'Client manages self-hosting, updates and server credentials'
        ],
        isAppendedToTotal: false
      };
    }

    const tierDef = AMC_TIERS.find((t) => t.id === chosenTier) || AMC_TIERS[1];
    const baseFee = cycle === 'annual' ? tierDef.annualFee : tierDef.quarterlyFee * 4;
    const addOnFee = extraHours * 1500 * 12; // annualized additional hours
    const totalTaxableAnnualFee = baseFee + addOnFee;
    const gstAmount = totalTaxableAnnualFee * 0.18;
    const totalWithGst = totalTaxableAnnualFee + gstAmount;

    return {
      tier: tierDef.id,
      tierName: tierDef.name,
      annualFee: totalTaxableAnnualFee,
      gstPercent: 18,
      gstAmount,
      totalAmount: totalWithGst,
      billingCycle: cycle,
      slaResponseHours: tierDef.slaHours,
      monthlyDevHours: tierDef.monthlyDevHours + extraHours,
      features: [
        ...tierDef.features,
        ...(extraHours > 0
          ? [`+${extraHours} Extra Dedicated Dev Hours/month (Total ${tierDef.monthlyDevHours + extraHours} hrs/mo)`]
          : [])
      ],
      isAppendedToTotal: appended
    };
  };

  // Dispatch change upwards whenever state changes
  useEffect(() => {
    const details = calculateAmcPlan(tier, billingCycle, isAppendedToTotal, additionalHours);
    onTierChange(details);
  }, [tier, billingCycle, isAppendedToTotal, additionalHours]);

  const activePlan = calculateAmcPlan(tier, billingCycle, isAppendedToTotal, additionalHours);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shrink-0 shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                AMC Calculator (Annual Maintenance Contract)
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                Interactive Planner
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select maintenance tier to automatically append annual upkeep, server uptime SLA & dedicated developer support to quote total.
            </p>
          </div>
        </div>

        {/* Append to Total Status Toggle */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAppendedToTotal}
              onChange={(e) => setIsAppendedToTotal(e.target.checked)}
              disabled={tier === 'none'}
              className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500 focus:ring-offset-slate-950 cursor-pointer"
            />
            <span className={tier === 'none' ? 'text-slate-500' : 'text-slate-200'}>
              Append to Quotation Total
            </span>
          </label>
        </div>
      </div>

      {/* Billing Cycle Frequency Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Select AMC Billing Cycle & Terms:</span>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Annual (1 Year)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-extrabold">
              Save 15%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle('quarterly')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              billingCycle === 'quarterly'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quarterly (Every 3 Months)
          </button>
        </div>
      </div>

      {/* Tier Selector Grid: Bronze, Silver, Gold */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AMC_TIERS.map((tierDef) => {
          const isSelected = tier === tierDef.id;
          const displayPrice =
            billingCycle === 'annual'
              ? tierDef.annualFee
              : tierDef.quarterlyFee * 4;
          const monthlyEquiv = Math.round(displayPrice / 12);

          return (
            <div
              key={tierDef.id}
              onClick={() => setTier(tierDef.id)}
              className={`relative cursor-pointer rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between border ${
                isSelected
                  ? `${tierDef.colorScheme.activeBorder} ${tierDef.colorScheme.bgActive} shadow-lg shadow-cyan-950/40`
                  : `${tierDef.colorScheme.border} bg-slate-950/70 hover:border-slate-600 hover:bg-slate-950`
              }`}
            >
              {/* Badge if available */}
              {tierDef.badge && (
                <div className="absolute -top-3 right-4">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md ${tierDef.colorScheme.badgeBg}`}
                  >
                    {tierDef.badge}
                  </span>
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400'
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                    <h4 className="text-base font-black text-white">{tierDef.name}</h4>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 min-h-[30px] leading-snug">
                  {tierDef.tagline}
                </p>

                {/* Price Display */}
                <div className="my-3.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800/80">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-white">
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400">/year</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      ₹{monthlyEquiv.toLocaleString('en-IN')}/mo
                    </span>
                  </div>

                  {billingCycle === 'quarterly' && (
                    <p className="text-[10px] text-cyan-400 mt-1">
                      Billed quarterly: ₹{tierDef.quarterlyFee.toLocaleString('en-IN')} every 3 months
                    </p>
                  )}
                </div>

                {/* Key Metrics Chips */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-1.5 text-slate-300">
                    <Zap className={`w-3.5 h-3.5 ${tierDef.colorScheme.accentText} shrink-0`} />
                    <div>
                      <span className="text-[10px] text-slate-500 block">Response SLA</span>
                      <strong className="text-white">{tierDef.slaHours} Hours</strong>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-1.5 text-slate-300">
                    <Code2 className={`w-3.5 h-3.5 ${tierDef.colorScheme.accentText} shrink-0`} />
                    <div>
                      <span className="text-[10px] text-slate-500 block">Included Dev</span>
                      <strong className="text-white">{tierDef.monthlyDevHours} hrs/mo</strong>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 border-t border-slate-800/80 pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Included Coverage:
                  </span>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    {tierDef.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-snug">
                        <Check className={`w-3.5 h-3.5 ${tierDef.colorScheme.accentText} shrink-0 mt-0.5`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom selection button */}
              <div className="mt-4 pt-3 border-t border-slate-800/60">
                <button
                  type="button"
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selected Plan</span>
                    </>
                  ) : (
                    <span>Choose {tierDef.name}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* No AMC Alternative Option */}
      <div
        onClick={() => setTier('none')}
        className={`cursor-pointer p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          tier === 'none'
            ? 'bg-slate-800/80 border-slate-500 text-white ring-1 ring-slate-400'
            : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              tier === 'none' ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
            }`}
          >
            {tier === 'none' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              No AMC (Self Managed / Standalone Delivery)
            </span>
            <span className="text-[11px] text-slate-500">
              Standard 30-day post-launch bug warranty only. Subsequent changes billed at ₹1,500/hr.
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-bold text-slate-300">₹0</span>
        </div>
      </div>

      {/* Live Calculation & Total Impact Box */}
      {tier !== 'none' && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Calculated AMC Annual Impact: {activePlan.tierName}
              </h4>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Total AMC (inc. 18% GST):</span>
              <strong className="text-cyan-300 font-mono font-bold text-sm">
                ₹{activePlan.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Base AMC Taxable:</span>
              <span className="font-bold text-slate-200">
                ₹{activePlan.annualFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">GST 18% on AMC:</span>
              <span className="font-bold text-slate-200">
                ₹{activePlan.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Guaranteed SLA:</span>
              <span className="font-bold text-cyan-300">
                {activePlan.slaResponseHours} Hours
              </span>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Included Dev Hours:</span>
              <span className="font-bold text-emerald-400">
                {activePlan.monthlyDevHours} hrs / month
              </span>
            </div>
          </div>

          {/* Quotation Total Status Notification */}
          <div className="flex items-center gap-2 pt-1 text-[11px]">
            {isAppendedToTotal ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  AMC Annual fee of ₹{activePlan.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} is automatically appended to the quotation grand total below.
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  AMC is currently set as an optional reference add-on and excluded from the quotation total.
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
