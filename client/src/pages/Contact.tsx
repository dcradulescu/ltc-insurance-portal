import { Layout } from "@/components/Layout";
import { LegalDisclaimerFooter } from '@/components/LegalDisclaimerFooter';
import { AboutHomeCare } from "@/components/AboutHomeCare";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, Mail, Clock, Send, Loader2, MessageCircle } from "lucide-react";

const VA_TEAL = "#34B1C4";
const VA_CHARCOAL = "#393F43";
const VA_GREY_BG = "#ECE8E8";
const VA_HEADING = "#454545";
const VA_BODY = "#555555";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "general", message: "" });
  const [sending, setSending] = useState(false);
  const contactMutation = trpc.email.sendContactForm.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSending(true);
    try {
      await contactMutation.mutateAsync(form);
      toast.success("Your message has been sent. We'll get back to you soon!");
      setForm({ name: "", email: "", phone: "", subject: "general", message: "" });
    } catch (_e) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Layout>
      {/* Hero */}
      <section className="relative text-white py-12">
        <div className="absolute inset-0">
          <img src="/manus-storage/contact-hero_fd7b1494.jpg" alt="Caregiver assisting senior at home" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(57,63,67,0.86)' }} />
        </div>
        <div className="container relative">
          <div className="flex items-center gap-3 mb-3">
            <MessageCircle className="w-6 h-6" style={{ color: VA_TEAL }} />
            <span className="text-sm uppercase tracking-widest text-white/85 font-semibold" style={{ fontFamily: "'Open Sans', sans-serif" }}>Get in Touch</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Roboto', sans-serif" }}>Contact Us</h1>
          <p className="text-white/80 max-w-2xl" style={{ fontFamily: "'Open Sans', sans-serif" }}>We're here to help you navigate the long-term care insurance claims process. Reach out with any questions or concerns.</p>
          {/* VA teal underline divider */}
          <div className="flex items-center gap-3 mt-5">
            <div style={{ height: 2, width: 40, background: VA_TEAL }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: VA_TEAL }} />
            <div style={{ height: 2, width: 40, background: VA_TEAL }} />
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="py-8" style={{ background: VA_GREY_BG }}>
        <div className="container max-w-4xl">
          <VideoPlaceholder
            title="How We Can Help"
            description="Learn about our support services and how we assist families with LTC insurance claims"
            thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/BCGoGYVjjQPMxhEc.jpg"
            videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NiJblCFJqXDChprB.mp4"
          />
        </div>
      </section>

      {/* Content */}
      <section className="py-12" style={{ background: '#ffffff' }}>
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>Reach Out</h2>
              <p className="text-sm leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>
                Our team of LTC insurance specialists is ready to assist you. Don't hesitate to reach out — no question is too small.
              </p>

              <div className="space-y-3">
                {[
                  { icon: <Phone className="w-5 h-5" style={{ color: VA_TEAL }} />, label: "Phone", value: "(864) 244-6300", sub: "Mon-Fri, 9am-5pm EST" },
                  { icon: <Mail className="w-5 h-5" style={{ color: VA_TEAL }} />, label: "Email", value: "Send us a message using the form", sub: "We respond within 24 hours" },
                  { icon: <Clock className="w-5 h-5" style={{ color: VA_TEAL }} />, label: "Response Time", value: "Within 24 business hours", sub: "Urgent matters prioritized" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded border transition-all duration-200 hover:shadow-sm" style={{ background: VA_GREY_BG, borderColor: '#e0e0e0' }}>
                    <div className="mt-0.5">{item.icon}</div>
                    <div>
                      <p className="font-bold text-sm" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>{item.label}</p>
                      <p className="text-sm" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>{item.value}</p>
                      <p className="text-xs" style={{ color: '#888', fontFamily: "'Open Sans', sans-serif" }}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded border" style={{ background: 'rgba(52,177,196,0.07)', borderColor: 'rgba(52,177,196,0.25)', borderLeft: `3px solid ${VA_TEAL}` }}>
                <h3 className="font-bold text-sm mb-1" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>Visit Our Website</h3>
                <p className="text-xs leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_BODY }}>
                  Learn more about our home care services at{" "}
                  <a href="https://www.scvisitingangels.com" target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold" style={{ color: VA_TEAL }}>scvisitingangels.com</a>.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="p-6 rounded border" style={{ background: VA_GREY_BG, borderColor: '#e0e0e0' }}>
                <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Roboto', sans-serif", color: VA_HEADING }}>Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_HEADING }}>Full Name *</Label>
                      <Input id="name" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your full name" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_HEADING }}>Email Address *</Label>
                      <Input id="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="your@email.com" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_HEADING }}>Phone Number</Label>
                      <Input id="phone" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(000) 000-0000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subject" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_HEADING }}>Subject</Label>
                      <Select value={form.subject} onValueChange={v => update("subject", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="claim-help">Claim Filing Help</SelectItem>
                          <SelectItem value="policy-review">Policy Review</SelectItem>
                          <SelectItem value="strategy-question">Strategy Question</SelectItem>
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message" style={{ fontFamily: "'Open Sans', sans-serif", color: VA_HEADING }}>Message *</Label>
                    <Textarea id="message" value={form.message} onChange={e => update("message", e.target.value)} placeholder="Tell us how we can help you..." rows={5} required />
                  </div>
                  <button type="submit" disabled={sending} className="va-btn inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AboutHomeCare />
      <LegalDisclaimerFooter />
    </Layout>
  );
}
