"use client";

import { useState } from "react";
import { CalendarDays, Clock, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ScheduleViewingProps {
  propertyTitle: string;
  agentName: string | null;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
];

export function ScheduleViewing({ propertyTitle, agentName }: ScheduleViewingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsOpen(false);
      setSelectedDate("");
      setSelectedTime("");
      setForm({ name: "", email: "", phone: "", notes: "" });
    }, 2500);
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setIsOpen(true)}
      >
        <CalendarDays className="mr-2 h-4 w-4" />
        Schedule Viewing
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4">
          <div className="w-full max-w-lg animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
            <Card className="bg-white shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Schedule a Viewing
                  </CardTitle>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1 hover:bg-muted transition-colors"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Book a time to visit {propertyTitle}
                </p>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div className="rounded-full bg-emerald-100 p-3">
                      <CheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-lg font-semibold">Viewing Requested!</p>
                    <p className="text-sm text-center text-muted-foreground">
                      {agentName ? `${agentName} will` : "The agent will"} confirm your
                      viewing for{" "}
                      <span className="font-medium text-foreground">
                        {new Date(selectedDate).toLocaleDateString("en-HK", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>{" "}
                      at <span className="font-medium text-foreground">{selectedTime}</span>.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Date Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="viewing-date">Preferred Date</Label>
                      <Input
                        id="viewing-date"
                        type="date"
                        min={minDateStr}
                        max={maxDateStr}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                      />
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-2">
                      <Label>Preferred Time</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {TIME_SLOTS.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`rounded-md border px-2 py-1.5 text-sm transition-colors ${
                              selectedTime === time
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary hover:bg-primary/5"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="viewing-name">Your Name</Label>
                        <Input
                          id="viewing-name"
                          placeholder="John Doe"
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="viewing-email">Email</Label>
                        <Input
                          id="viewing-email"
                          type="email"
                          placeholder="you@email.com"
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="viewing-phone">Phone</Label>
                        <Input
                          id="viewing-phone"
                          type="tel"
                          placeholder="+852 9XXX XXXX"
                          value={form.phone}
                          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="viewing-notes">Notes (optional)</Label>
                      <Textarea
                        id="viewing-notes"
                        rows={2}
                        placeholder="Any specific requirements or questions..."
                        value={form.notes}
                        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
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
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={!selectedDate || !selectedTime}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Request Viewing
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
