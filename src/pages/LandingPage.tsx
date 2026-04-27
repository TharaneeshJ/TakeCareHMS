import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Activity, Calendar, BarChart2, ChevronDown,
  Plus, ArrowRight, MessageCircle, Globe, Hash, Video
} from 'lucide-react';
import { Logo } from '../components/Logo';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return ref;
}

const faqs = [
  { q: 'Is TakeCare HMS suitable for small clinics?', a: 'Absolutely. TakeCare HMS scales from single-doctor clinics to multi-specialty hospital networks with hundreds of staff.' },
  { q: 'How secure is patient data?', a: 'We use AES-256 encryption at rest and TLS 1.3 in transit. Full HIPAA and ISO 27001 compliance out of the box.' },
  { q: 'Can we migrate from our existing system?', a: 'Yes. Our team handles end-to-end data migration with zero downtime. Most migrations complete in under 48 hours.' },
  { q: 'Is there a mobile app?', a: 'Native iOS and Android apps for doctors and patients are included in all plans at no extra cost.' },
  { q: 'What kind of support is available?', a: '24/7 dedicated support via chat, email and phone. Enterprise plans include a named account manager.' },
];

const modules = [
  { icon: Shield,   label: 'Patient Management',  desc: 'Complete EMR, admissions, discharge and transfer workflows.' },
  { icon: Calendar, label: 'Appointment Scheduling', desc: 'Smart calendar with automated reminders and slot management.' },
  { icon: Activity, label: 'ICU & Ward Management', desc: 'Real-time bed tracking, vitals monitoring, nursing notes.' },
  { icon: BarChart2,label: 'Billing & Insurance',  desc: 'Automated invoicing, insurance claim processing, payment links.' },
  { icon: Shield,   label: 'Lab & Radiology',      desc: 'Order tests, receive results, integrate PACS/LIS seamlessly.' },
  { icon: Activity, label: 'Pharmacy',              desc: 'Drug inventory, prescription fulfilment, expiry alerts.' },
];

export function LandingPage() {
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroRef = useReveal();
  const statsRef = useReveal();
  const featuresRef = useReveal();
  const modulesRef = useReveal();
  const testimonialsRef = useReveal();
  const faqRef = useReveal();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const s: Record<string, React.CSSProperties> = {
    navbar: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 68, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 40px', transition: 'all 0.3s ease', background: scrolled ? 'rgba(255,255,255,0.9)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid #E5E5E5' : 'none' },
    container: { maxWidth: 1160, margin: '0 auto', padding: '0 24px', width: '100%' },
    hero: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', background: '#FAFAFA' },
    statBar: { background: '#0A0A0A', padding: '48px 24px' },
    featuresSection: { padding: '96px 24px', background: '#FFFFFF' },
    darkSection: { background: '#0A0A0A', padding: '96px 24px' },
    lightSection: { padding: '96px 24px', background: '#FAFAFA' },
  };

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif' }}>
      {/* NAVBAR */}
      <nav style={s.navbar}>
        <Logo />
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Features','Modules','Testimonials','FAQ'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 14, fontWeight: 500, color: '#525252', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color='#0A0A0A')}
              onMouseLeave={e => (e.currentTarget.style.color='#525252')}>{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={() => nav('/login')}>Sign In</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div ref={heroRef} className="reveal" style={{ maxWidth: 780 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 9999, padding: '5px 14px', marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} className="animate-pulse-dot" />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#16A34A', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Now in Production</span>
          </div>
          <h1 style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#0A0A0A', marginBottom: 20 }}>
            The modern OS for<br /><span style={{ color: '#16A34A' }}>hospital operations</span>
          </h1>
          <p style={{ fontSize: 18, fontWeight: 300, color: '#525252', lineHeight: 1.6, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
            TakeCare HMS unifies patients, doctors, wards, labs, pharmacy and billing into one beautifully designed platform.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-green btn-lg" onClick={() => nav('/login')}>Get Started <ArrowRight size={16} strokeWidth={1.5} /></button>
            <button className="btn btn-secondary btn-lg" onClick={() => nav('/login')}>View Demo</button>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={s.statBar}>
        <div ref={statsRef} className="reveal" style={{ ...s.container, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
          {[['2,400+','Hospitals Using TakeCare'],['98.9%','Uptime SLA'],['50ms','Avg Response Time'],['HIPAA','Fully Compliant']].map(([num, label], i) => (
            <div key={i} style={{ textAlign: 'center', padding: '8px 24px', borderRight: i < 3 ? '1px solid #2A2A2A' : 'none' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 13, color: '#A3A3A3', marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={s.featuresSection}>
        <div style={s.container}>
          <div ref={featuresRef} className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Features</div>
            <h2 className="section-title">Everything your hospital needs</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {[
              { icon: Shield, title: 'Role-Based Access', desc: 'Separate, tailored dashboards for admins, doctors and patients — each with exactly the tools they need.' },
              { icon: Activity, title: 'Real-Time Monitoring', desc: 'Live bed occupancy, patient vitals, and alert escalation so your team always knows what\'s happening.' },
              { icon: Calendar, title: 'Smart Scheduling', desc: 'Conflict-free appointment booking with automated reminders, waitlists and rescheduling flows.' },
              { icon: BarChart2, title: 'Analytics & Reports', desc: 'Revenue, occupancy, staff performance and patient outcome reports — export in one click.' },
              { icon: Shield, title: 'Secure & Compliant', desc: 'HIPAA-ready with end-to-end encryption, audit logs, and granular data permissions.' },
              { icon: Activity, title: 'Seamless Integrations', desc: 'Connect your existing LIS, PACS, pharmacy and insurance platforms via open APIs.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="card" style={{ cursor: 'default', animationDelay: `${i*0.07}s` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FAFAFA'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FFFFFF'; }}>
                <div className="icon-box" style={{ background: '#F0FDF4', marginBottom: 16 }}>
                  <Icon size={18} strokeWidth={1.5} color="#16A34A" />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#A3A3A3', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '96px 24px', background: '#FAFAFA' }}>
        <div style={s.container}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>How It Works</div>
            <h2 className="section-title">Up and running in three steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {[
              { n: '01', title: 'Onboard your staff', desc: 'Add admins, doctors and patients — import from CSV or connect your existing directory.' },
              { n: '02', title: 'Configure your hospital', desc: 'Set up wards, departments, billing codes and appointment rules in minutes.', featured: true },
              { n: '03', title: 'Go live instantly', desc: 'Your team logs in and starts using TakeCare HMS immediately. No training sessions required.' },
            ].map(({ n, title, desc, featured }) => (
              <div key={n} className={`card${featured ? ' card-green' : ''}`}>
                <div style={{ fontSize: 40, fontWeight: 700, color: featured ? '#16A34A' : '#E5E5E5', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 16 }}>{n}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#A3A3A3', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" style={s.lightSection}>
        <div style={{ ...s.container, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: 100 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Modules</div>
            <h2 className="section-title" style={{ marginBottom: 16 }}>A module for every workflow</h2>
            <p style={{ fontSize: 15, color: '#525252', lineHeight: 1.65 }}>Every department gets a purpose-built module. Nothing generic, nothing missing.</p>
            <button className="btn btn-primary" style={{ marginTop: 28 }} onClick={() => nav('/login')}>Explore All Modules <ArrowRight size={14} strokeWidth={1.5} /></button>
          </div>
          <div ref={modulesRef} className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {modules.map(({ icon: Icon, label, desc }, i) => (
              <div key={i} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 24px' }}>
                <div className="icon-box" style={{ background: '#F0FDF4', flexShrink: 0 }}>
                  <Icon size={18} strokeWidth={1.5} color="#16A34A" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{label}</span>
                    <ArrowRight size={13} strokeWidth={1.5} color="#A3A3A3" />
                  </div>
                  <span style={{ fontSize: 13, color: '#A3A3A3', lineHeight: 1.5 }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" style={s.darkSection}>
        <div style={s.container}>
          <div ref={testimonialsRef} className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="eyebrow" style={{ color: '#A3A3A3', marginBottom: 12 }}>Testimonials</div>
            <h2 className="section-title" style={{ color: '#FFFFFF' }}>Trusted by leading hospitals</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {[
              { q: '"TakeCare HMS reduced our billing errors by 84% in the first month. The interface is the cleanest we\'ve ever used."', name: 'Dr. Neha Patel', role: 'Medical Director, Apollo Delhi', initials: 'NP' },
              { q: '"Our ward nurses now spend 40% less time on paperwork. The ward round module is genuinely brilliant."', name: 'Rajesh Kumar', role: 'CTO, Fortis Healthcare', initials: 'RK' },
              { q: '"Patient satisfaction scores jumped 22 points after we rolled out the patient portal. Game-changing."', name: 'Dr. Sunita Verma', role: 'CMO, Manipal Hospitals', initials: 'SV' },
            ].map(({ q, name, role, initials }, i) => (
              <div key={i} style={{ background: '#111111', border: '1px solid #2A2A2A', borderRadius: 14, padding: 28 }}>
                <p style={{ fontSize: 14, fontStyle: 'italic', color: '#A3A3A3', lineHeight: 1.7, marginBottom: 20 }}>{q}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1A1A1A', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#A3A3A3' }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{name}</div>
                    <div style={{ fontSize: 12, color: '#A3A3A3' }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '96px 24px', background: '#FFFFFF' }}>
        <div style={{ ...s.container, maxWidth: 720 }}>
          <div ref={faqRef} className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>FAQ</div>
            <h2 className="section-title">Common questions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="card" style={{ padding: '0', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A' }}>{q}</span>
                  <Plus size={16} strokeWidth={1.5} color="#A3A3A3" style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s ease' }} />
                </div>
                <div style={{ maxHeight: openFaq === i ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                  <p style={{ padding: '0 24px 18px', fontSize: 13, color: '#525252', lineHeight: 1.65 }}>{a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...s.darkSection, textAlign: 'center' }}>
        <div style={s.container}>
          <div className="eyebrow" style={{ color: '#A3A3A3', marginBottom: 16 }}>Get Started</div>
          <h2 className="section-title" style={{ color: '#FFFFFF', marginBottom: 12 }}>Ready to modernise your hospital?</h2>
          <p style={{ fontSize: 15, color: '#A3A3A3', marginBottom: 36 }}>Join thousands of healthcare facilities already running on TakeCare HMS.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-green btn-lg" onClick={() => nav('/login')}>Start Free Trial</button>
            <button className="btn" style={{ background: 'transparent', border: '1px solid #2A2A2A', color: '#FFFFFF', padding: '12px 28px', fontSize: 15 }}>Talk to Sales</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0A0A0A', borderTop: '1px solid #1A1A1A', padding: '64px 24px 40px' }}>
        <div style={{ ...s.container, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
          <div>
            <Logo dark />
            <p style={{ fontSize: 13, color: '#525252', marginTop: 16, lineHeight: 1.65, maxWidth: 260 }}>The complete hospital management platform for modern healthcare.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {[MessageCircle, Globe, Hash, Video].map((Icon, i) => (
                <button key={i} style={{ width: 36, height: 36, borderRadius: 8, background: '#111111', border: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#2A2A2A')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1A1A1A')}>
                  <Icon size={14} strokeWidth={1.5} color="#525252" />
                </button>
              ))}
            </div>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Modules', 'Pricing', 'Changelog'] },
            { title: 'Company', links: ['About', 'Careers', 'Blog', 'Contact'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'HIPAA', 'Security'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#525252', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>{title}</div>
              {links.map(l => (
                <div key={l} style={{ marginBottom: 10 }}>
                  <a href="#" style={{ fontSize: 13, color: '#525252', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#525252')}>{l}</a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#525252' }}>© 2026 TakeCare HMS. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#525252' }}>All systems operational</span>
          </div>
        </div>
      </footer>

      {/* Scroll indicator */}
      <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', opacity: scrolled ? 0 : 1, transition: 'opacity 0.3s', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#A3A3A3', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Scroll</span>
          <ChevronDown size={14} strokeWidth={1.5} color="#A3A3A3" />
        </div>
      </div>
    </div>
  );
}
