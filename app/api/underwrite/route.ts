import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessName = "Kiran Enterprise Pvt Ltd",
      turnover = 12400000,
      growthRate = 18.0,
      gstCompliance = 70,
      averageBalance = 485000,
      employeeCount = 42,
      transactionVolume = 18240,
      riskFactors = 45,
      creditScore = 76,
      recommendedExposure = "₹10,00,000",
      customApiKey
    } = body;

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    // Local deterministic fallback function
    const generateLocalFallback = () => {
      const formattedTurnover = turnover >= 10000000 
        ? `₹${(turnover / 10000000).toFixed(2)} Cr` 
        : `₹${(turnover / 100000).toFixed(2)} Lakh`;
      
      const formattedBalance = averageBalance >= 100000 
        ? `₹${(averageBalance / 100000).toFixed(2)} Lakh` 
        : `₹${averageBalance}`;

      const stability = averageBalance > 500000 ? "strong" : "stable";
      const compliance = gstCompliance >= 90 ? "high" : "moderate";
      const activity = turnover >= 15000000 ? "robust" : "healthy";

      const strengths = `${businessName} demonstrates ${activity} gross trade activity, ${stability} average cash balance of ${formattedBalance} and ${compliance} compliance.`;
      
      const risks = riskFactors > 65 
        ? `Elevated risk deductions of -${riskFactors} points exist due to transaction warnings; however, underlying cash flow remains supportive.`
        : riskFactors > 30
          ? `Moderate client dependency risk is noted with a deduction of -${riskFactors} points, but overall balance sheet leverage is low.`
          : `Minimal operational risks are flagged (deduction score of -${riskFactors} points).`;

      const recommendation = `The business is recommended for a credit limit exposure of ${recommendedExposure} under standard banking terms.`;

      const summaryText = `${businessName} presents a Financial Health Score of ${creditScore}/100. ${strengths} ${risks} ${recommendation} recommended for Working Capital financing to fund ongoing business operations, subject to policy guidelines and standard internal checks.`;
      
      return {
        summary: summaryText,
        gstInsight: `Turnover of ${formattedTurnover} with ${growthRate}% YoY growth rate.`,
        upiInsight: `Volume of ${transactionVolume.toLocaleString()} settlements shows active velocity.`,
        bankInsight: `Average daily balance maintained stable at ${formattedBalance}.`,
        epfoInsight: `Active registry for ${employeeCount} payroll employees.`
      };
    };

    if (apiKey) {
      try {
        const prompt = `You are an expert credit underwriting consultant for IDBI Bank.
Analyze the following MSME alternate data metrics and generate a structured JSON object containing concise financial health insights:
- Business Name: ${businessName}
- GST Turnover: ₹${turnover}
- Growth Rate: ${growthRate}% YoY
- GST Compliance: ${gstCompliance}%
- Average Bank Balance: ₹${averageBalance}
- EPFO Payroll Headcount: ${employeeCount}
- UPI Transaction Volume: ${transactionVolume}
- Risk Deduction Score: -${riskFactors}/100
- Financial Health Score: ${creditScore}/100
- Recommended Credit Exposure: ${recommendedExposure}

The JSON object MUST follow this exact schema:
{
  "summary": "A professional underwriting summary paragraph (max 120 words, no markdown)",
  "gstInsight": "A short sentence analyzing their GST performance (max 15 words)",
  "upiInsight": "A short sentence analyzing their UPI transaction velocity and activity (max 15 words)",
  "bankInsight": "A short sentence analyzing their average bank balance and liquidity (max 15 words)",
  "epfoInsight": "A short sentence analyzing their workforce size and payroll trends (max 15 words)"
}

Ensure all insights are professional, based strictly on the provided data, and do not contain any markdown formatting.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          try {
            const parsed = JSON.parse(rawText);
            return NextResponse.json({
              success: true,
              isMock: false,
              source: "Gemini 1.5 Flash",
              summary: parsed.summary,
              gstInsight: parsed.gstInsight,
              upiInsight: parsed.upiInsight,
              bankInsight: parsed.bankInsight,
              epfoInsight: parsed.epfoInsight
            });
          } catch (e) {
            console.error("Failed to parse Gemini JSON output:", e);
          }
        }
      } catch (err) {
        console.error("Gemini underwriter call error, falling back:", err);
      }
    }

    // Heuristic fallback
    const fallbackResults = generateLocalFallback();
    return NextResponse.json({
      success: true,
      isMock: true,
      source: "Underwriting Heuristics (Local)",
      summary: fallbackResults.summary,
      gstInsight: fallbackResults.gstInsight,
      upiInsight: fallbackResults.upiInsight,
      bankInsight: fallbackResults.bankInsight,
      epfoInsight: fallbackResults.epfoInsight
    });

  } catch (error: any) {
    console.error("Error in underwrite endpoint:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal Server Error"
    }, { status: 500 });
  }
}
