"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare, Square, ChevronRight } from "lucide-react";

export function Roadmap() {
  const items = [
    { title: "Financial Health Card", done: true },
    { title: "GST Integration", done: false },
    { title: "UPI Analytics", done: false },
    { title: "Account Aggregator Integration", done: false },
    { title: "AI Credit Recommendation Engine", done: false },
    { title: "Loan Eligibility & Approval Engine", done: false },
  ];

  return (
    <Card className="rounded-sm border-slate-200 shadow-sm bg-white mt-12">
      <CardHeader className="bg-slate-50 border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-900">Product Roadmap</CardTitle>
        <CardDescription className="text-slate-500">Future vision for the MSME Underwriting Platform</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-md bg-slate-50/50 border border-slate-100 transition-colors hover:bg-slate-50">
              {item.done ? (
                <CheckSquare className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-slate-300 flex-shrink-0" />
              )}
              <span className={`text-sm font-medium ${item.done ? 'text-slate-900' : 'text-slate-500'}`}>
                {item.title}
              </span>
              {item.done && <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-sm">Live</span>}
              {!item.done && <ChevronRight className="h-4 w-4 ml-auto text-slate-300" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
