import { Link } from "wouter";
import {
  Phone,
  PhoneCall,
  ExternalLink,
  CheckCircle2,
  Heart,
  Shield,
  Star,
  Clock,
  BookOpen,
  FileText,
  Sparkles,
  MapPin,
  Gift,
  Users,
  Award,
} from "lucide-react";
import { LegalDisclaimerFooter } from "@/components/LegalDisclaimerFooter";

const VA_TEAL    = "#34B1C4";
const VA_BLUE    = "#0692D7";
const VA_HEADING = "#1a2e44";
const VA_BODY    = "#4a5568";

export function SiteFooter() {
  return (
    <>
      {/* ── Free Consultation Callout ── */}
      <section className="py-section" style={{ background: '#F2F6FA', borderTop: '1px solid #e2eaf2', borderBottom: '1px solid #e2eaf2' }}>
        <div className="container">
          <div
            className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl px-8 py-6"
            style={{ background: 'linear-gradient(135deg, #34B1C4 0%, #0692D7 100%)', boxShadow: '0 4px 20px rgba(6,146,215,0.25)' }}
          >
            {/* Left: icon + text */}
            <div className="flex items-center gap-5 text-white">
              <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Phone className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-lg md:text-xl font-bold leading-snug" style={{ fontFamily: "'Roboto', sans-serif" }}>
                  Need Help Navigating This Process?
                </div>
                <div className="text-sm text-white/85 mt-1" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  Call SC Visiting Angels for a <strong className="text-white">complimentary consultation</strong> — we guide families through every step at no charge.
                </div>
              </div>
            </div>
            {/* Right: phone + button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
              <a
                href="tel:8642446300"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-bold transition-all hover:opacity-90"
                style={{ background: '#ffffff', color: '#0692D7', fontFamily: "'Roboto', sans-serif" }}
              >
                <Phone className="w-4 h-4" />
                (864) 244-6300
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-bold transition-all hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1.5px solid rgba(255,255,255,0.4)', fontFamily: "'Roboto', sans-serif" }}
              >
                Schedule Online
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Looking for Home Care? We Can Help ── */}
      <section className="py-section" style={{ background: '#ffffff' }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            {/* Left: content */}
            <div className="flex flex-col justify-start">
              {/* Title row with dove */}
              <div className="flex items-center gap-4 mb-3">
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NnImPmoCbXXIfDiW.png"
                  alt="SC Visiting Angels dove"
                  className="w-14 h-14 object-contain flex-shrink-0"
                />
                <div>
                  <h2 className="text-3xl font-bold leading-tight" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>
                    Looking for Home Care?<br />
                    <span style={{ color: VA_TEAL }}>We Can Help.</span>
                  </h2>
                </div>
              </div>
              <hr className="mb-5" style={{ borderColor: VA_TEAL, borderTopWidth: 2 }} />

              {/* Our Services */}
              <div className="mb-5">
                <h3 className="text-base font-bold mb-2" style={{ color: VA_HEADING, fontFamily: "'Roboto', sans-serif" }}>Our Home Care Services</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    'Personal Care & Bathing Assistance',
                    'Dressing & Grooming Support',
                    'Meal Preparation & Nutrition',
                    'Medication Reminders',
                    'Companionship & Emotional Support',
                    "Dementia & Alzheimer\u2019s Care",
                    'Light Housekeeping',
                    'Transportation & Errands',
                    'Respite Care for Family Caregivers',
                    '24/7 On-Call Support',
                  ].map((svc) => (
                    <div key={svc} className="flex items-start gap-2">
                      <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(52,177,196,0.15)' }}>
                        <CheckCircle2 className="w-3 h-3" style={{ color: VA_TEAL }} />
                      </span>
                      <span className="text-sm leading-snug" style={{ color: VA_BODY, fontFamily: "'Open Sans', sans-serif" }}>{svc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What Makes Us Different */}
              <div className="mb-5 rounded-xl p-4" style={{ background: 'rgba(52,177,196,0.06)', border: '1px solid rgba(52,177,196,0.2)' }}>
                <h3 className="text-base font-bold mb-2" style={{ color: VA_HEADING, fontFamily: "'Roboto', sans-serif" }}>What Makes Visiting Angels Different</h3>
                <div className="space-y-1.5">
                  {[
                    { icon: Heart,  text: 'Locally owned & operated — we know Upstate SC families personally' },
                    { icon: Shield, text: 'Carefully screened, trained, and background-checked caregivers' },
                    { icon: Star,   text: 'You choose your caregiver — we never assign without your approval' },
                    { icon: Clock,  text: 'Flexible scheduling — from a few hours to around-the-clock care' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-2">
                      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: VA_TEAL }} />
                      <span className="text-sm leading-snug" style={{ color: VA_BODY, fontFamily: "'Open Sans', sans-serif" }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How We Help with LTC */}
              <div className="mb-6 rounded-xl p-4" style={{ background: 'rgba(6,146,215,0.06)', border: '1px solid rgba(6,146,215,0.2)' }}>
                <h3 className="text-base font-bold mb-2" style={{ color: VA_HEADING, fontFamily: "'Roboto', sans-serif" }}>How We Help with Your LTC Insurance</h3>
                <div className="space-y-1.5">
                  {[
                    { icon: BookOpen, text: 'Education — we explain your ADL requirements and what qualifies for benefits' },
                    { icon: FileText, text: 'Policy — we help you understand your coverage, elimination period, and daily benefit' },
                    { icon: Sparkles, text: "Strategy — we build a custom care plan that satisfies your insurer\u2019s documentation requirements" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-2">
                      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: VA_BLUE }} />
                      <span className="text-sm leading-snug" style={{ color: VA_BODY, fontFamily: "'Open Sans', sans-serif" }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Centered buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/contact">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold shadow-lg transition-all duration-200 hover:-translate-y-0.5 text-white" style={{ background: VA_TEAL, fontFamily: "'Roboto', sans-serif" }}>
                    <PhoneCall className="w-4 h-4" /> Contact Us
                  </button>
                </Link>
                <a href="https://www.SCVisitingAngels.com" target="_blank" rel="noopener noreferrer">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 text-white" style={{ background: VA_BLUE, fontFamily: "'Roboto', sans-serif" }}>
                    Learn More <ExternalLink className="w-4 h-4" />
                  </button>
                </a>
              </div>
            </div>

            {/* Right: image — same height as content */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl hidden lg:block" style={{ minHeight: 500 }}>
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/lSMqOjgOjuvfRlJs.jpg"
                alt="SC Visiting Angels caregiver providing compassionate home care to a senior"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: 'center' }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(52,177,196,0.25) 0%, transparent 60%)' }} />
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 rounded-xl px-5 py-4 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-1">
                  <img
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NnImPmoCbXXIfDiW.png"
                    alt="SC Visiting Angels"
                    className="w-8 h-8 object-contain"
                  />
                  <span className="font-bold text-sm" style={{ color: VA_HEADING, fontFamily: "'Roboto', sans-serif" }}>SC Visiting Angels</span>
                </div>
                <div className="text-xs" style={{ color: '#666', fontFamily: "'Open Sans', sans-serif" }}>Locally owned · Upstate SC · (864) 244-6300</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Home Care Stats Bar ── */}
      <section className="py-section relative overflow-hidden" style={{ background: VA_TEAL }}>
        {[
          { w: 120, h: 120, top: '-20px',  left: '5%',  op: 0.12 },
          { w: 80,  h: 80,  top: '10px',   left: '18%', op: 0.08 },
          { w: 160, h: 160, top: '-40px',  left: '38%', op: 0.07 },
          { w: 60,  h: 60,  top: '20px',   left: '55%', op: 0.10 },
          { w: 100, h: 100, top: '-10px',  left: '70%', op: 0.09 },
          { w: 140, h: 140, top: '-30px',  left: '85%', op: 0.08 },
          { w: 50,  h: 50,  top: '30px',   left: '92%', op: 0.11 },
          { w: 90,  h: 90,  top: '-5px',   left: '48%', op: 0.06 },
          { w: 85,  h: 85,  bottom: '-18px', left: '8%',  op: 0.09 },
          { w: 55,  h: 55,  bottom: '6px',   left: '22%', op: 0.08 },
          { w: 115, h: 115, bottom: '-28px', left: '45%', op: 0.07 },
          { w: 48,  h: 48,  bottom: '10px',  left: '62%', op: 0.10 },
          { w: 95,  h: 95,  bottom: '-20px', left: '75%', op: 0.08 },
          { w: 65,  h: 65,  bottom: '8px',   left: '88%', op: 0.09 },
        ].map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: b.w,
              height: b.h,
              top: (b as any).bottom !== undefined ? 'auto' : (b as any).top,
              bottom: (b as any).bottom,
              left: b.left,
              background: `rgba(255,255,255,${b.op})`,
            }}
          />
        ))}
        <div className="relative container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: MapPin, num: '22+',  suffix: '',  label: 'Years Serving Upstate SC' },
              { icon: Gift,   num: 'FREE', suffix: '',  label: 'In-Home Consultation' },
              { icon: Users,  num: '1000', suffix: '+', label: 'Families Served' },
              { icon: Award,  num: 'Yes!', suffix: '',  label: 'Long Term Care Experts' },
            ].map(({ icon: Icon, num, suffix, label }) => (
              <div key={label} className="flex flex-col items-center text-center rounded-xl p-5 shadow-sm" style={{ background: 'rgba(255,255,255,0.18)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.25)' }}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Roboto', sans-serif" }}>{num}{suffix}</div>
                <div className="text-xs text-white/85 font-medium leading-snug" style={{ fontFamily: "'Open Sans', sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LegalDisclaimerFooter />
    </>
  );
}
