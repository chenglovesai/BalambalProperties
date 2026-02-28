"use client";

import { useState } from "react";
import { Phone, Mail, Send, User, Briefcase, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface ContactDialogProps {
  agentName: string | null;
  agentCompany: string | null;
  agentPhone: string | null;
  agentEmail: string | null;
  propertyTitle: string;
  propertyId: string;
}

export function ContactDialog({
  agentName,
  agentCompany,
  agentPhone,
  agentEmail,
  propertyTitle,
  propertyId,
}: ContactDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: `Hi, I'm interested in "${propertyTitle}". Could you please provide more details and arrange a viewing?`,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production, this would POST to an API endpoint
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsOpen(false);
      setForm((prev) => ({ ...prev, name: "", email: "", phone: "" }));
    }, 2500);
  }

  if (!agentName) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        Agent Contact
      </h3>
      <div className="space-y-2 text-sm">
        <p className="font-medium">{agentName}</p>
        {agentCompany && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5" />
            {agentCompany}
          </p>
        )}
        {agentPhone && (
          <a href={`tel:${agentPhone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Phone className="h-3.5 w-3.5" />
            {agentPhone}
          </a>
        )}
        {agentEmail && (
          <a href={`mailto:${agentEmail}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="h-3.5 w-3.5" />
            {agentEmail}
          </a>
        )}
      </div>

      <div className="flex gap-2">
        {agentPhone && (
          <a href={`tel:${agentPhone}`} className="flex-1">
            <Button className="w-full" size="sm">
              <Phone className="mr-2 h-4 w-4" />
              Call
            </Button>
          </a>
        )}
        <Button
          variant={agentPhone ? "outline" : "default"}
          className="flex-1"
          size="sm"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Enquire
        </Button>
      </div>

      {/* Inquiry Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <Card className="bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Send className="h-5 w-5 text-primary" />
                  Send Enquiry
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Contact {agentName} about this property
                </p>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div className="rounded-full bg-emerald-100 p-3">
                      <CheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-lg font-semibold">Enquiry Sent!</p>
                    <p className="text-sm text-center text-muted-foreground">
                      {agentName} will get back to you shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-name">Your Name</Label>
                      <Input
                        id="inquiry-name"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="inquiry-email">Email</Label>
                        <Input
                          id="inquiry-email"
                          type="email"
                          placeholder="you@email.com"
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inquiry-phone">Phone</Label>
                        <Input
                          id="inquiry-phone"
                          type="tel"
                          placeholder="+852 9XXX XXXX"
                          value={form.phone}
                          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-message">Message</Label>
                      <Textarea
                        id="inquiry-message"
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1">
                        <Send className="mr-2 h-4 w-4" />
                        Send Enquiry
                      </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Your contact details will be shared with the agent for this listing only.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
