"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ar } from "@/i18n/ar";

type InquiryType = "general" | "business";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inquiryType, setInquiryType] = useState<InquiryType>("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setName("");
    setEmail("");
    setMessage("");
    setInquiryType("general");
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-5 text-sm text-muted-foreground leading-relaxed">
        {ar.contact.form.placeholderNotice}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-label={ar.contact.form.title}>
      <div className="space-y-2">
        <Label htmlFor="contact-name">{ar.contact.form.nameLabel}</Label>
        <Input
          id="contact-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">{ar.contact.form.emailLabel}</Label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          dir="ltr"
          className="text-start"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium mb-1">{ar.contact.form.inquiryTypeLabel}</legend>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="radio"
              name="inquiry-type"
              checked={inquiryType === "general"}
              onChange={() => setInquiryType("general")}
              className="accent-accent"
            />
            {ar.contact.form.generalInquiry}
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="radio"
              name="inquiry-type"
              checked={inquiryType === "business"}
              onChange={() => setInquiryType("business")}
              className="accent-accent"
            />
            {ar.contact.form.businessInquiry}
          </label>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="contact-message">{ar.contact.form.messageLabel}</Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          className="min-h-[140px]"
          dir="auto"
        />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{ar.contact.form.helper}</p>

      <Button type="submit">{ar.contact.form.submit}</Button>
    </form>
  );
}
