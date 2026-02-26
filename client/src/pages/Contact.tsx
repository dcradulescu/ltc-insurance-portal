import { Layout } from "@/components/Layout";
import { VideoPlaceholder } from "@/components/VideoPlaceholder";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Clock, Send, Loader2, MessageCircle } from "lucide-react";

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
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/ybTvcuNvIxVRebPd.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#1a2a3a]/80" />
        </div>
        <div className="container relative">
          <div className="flex items-center gap-3 mb-3">
            <MessageCircle className="w-6 h-6 text-primary" />
            <span className="text-sm uppercase tracking-wider text-white/60 font-medium">Get in Touch</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3">Contact Us</h1>
          <p className="text-white/80 max-w-2xl">We're here to help you navigate the long-term care insurance claims process. Reach out with any questions or concerns.</p>
        </div>
      </section>

      {/* Video */}
      <section className="py-8 bg-secondary">
        <div className="container max-w-4xl">
          <VideoPlaceholder title="How We Can Help" description="Learn about our support services and how we assist families with LTC insurance claims" thumbnailUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/BCGoGYVjjQPMxhEc.jpg" videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663383586656/NiJblCFJqXDChprB.mp4" />
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-white">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-foreground">Reach Out</h2>
              <p className="text-muted-foreground text-sm">Our team of LTC insurance specialists is ready to assist you. Don't hesitate to reach out — no question is too small.</p>

              <div className="space-y-4">
                {[
                  { icon: <Phone className="w-5 h-5 text-primary" />, label: "Phone", value: "Contact us for phone support", sub: "Mon-Fri, 9am-5pm EST" },
                  { icon: <Mail className="w-5 h-5 text-primary" />, label: "Email", value: "Send us a message using the form", sub: "We respond within 24 hours" },
                  { icon: <Clock className="w-5 h-5 text-primary" />, label: "Response Time", value: "Within 24 business hours", sub: "Urgent matters prioritized" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                    <div className="mt-0.5">{item.icon}</div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-sm text-foreground mb-2">Need Immediate Help?</h3>
                <p className="text-xs text-muted-foreground">Use the chat widget in the bottom-right corner for instant assistance with common questions about LTC insurance.</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-secondary p-6 rounded-lg border border-border">
                <h2 className="font-serif text-xl font-bold text-foreground mb-4">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your full name" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="your@email.com" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(000) 000-0000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subject">Subject</Label>
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
                    <Label htmlFor="message">Message *</Label>
                    <Textarea id="message" value={form.message} onChange={e => update("message", e.target.value)} placeholder="Tell us how we can help you..." rows={5} required />
                  </div>
                  <Button type="submit" disabled={sending} className="w-full md:w-auto gap-2">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
