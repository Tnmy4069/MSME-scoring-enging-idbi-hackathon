import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // Seed prompt with the context of the active MSME
    let systemInstructions = `You are a helpful, expert AI Credit Underwriting Assistant for IDBI Bank.
Your role is to explain alternate data credit assessments, score derivations, risk factors, and recommended credit exposures to the credit officer or the applicant.

`;

    if (context && context.hasData) {
      systemInstructions += `Here is the current active MSME evaluation profile:
- Business Name: ${context.businessName || "Kiran Enterprise Pvt Ltd"}
- Financial Health Score: ${context.financialHealthScore}/100 (BHI: ${context.bhiScore}, RAI: ${context.raiScore})
- Recommended Credit Limit/Exposure: ${context.recommendedLimit}
- GST Turnover: ₹${(context.gstTurnover / 10000000).toFixed(2)} Cr (Growth YoY: ${context.gstGrowth}%, Compliance: ${context.gstCompliance}%)
- UPI Merchant Settlements Inflow: ₹${(context.upiInflow / 100000).toFixed(1)} Lakh (Transactions: ${context.upiTransactions}, Bounce Rate: ${context.upiBounce}%)
- Banking Average Daily Balance: ₹${(context.bankBalance / 100000).toFixed(2)} Lakh (EMI Burden: ${context.bankEmi}, Cash Flow Stability: ${context.bankStability})
- EPFO Payroll headcount: ${context.epfoEmployees} employees (Growth Trend: ${context.epfoGrowth}%)

Key Decisions & Drivers:
- Recommended product is: ${context.recommendedProduct}
- Primary Strengths: ${context.strengths || "Strong alternate data coverage, verified UPI history"}
- Primary Risks/Deductions: ${context.risks || "Moderate supplier concentration"}

`;
    } else {
      systemInstructions += `No specific MSME data has been uploaded yet. Provide a general professional overview of how alternate data (GST, UPI, EPFO, Banking) is leveraged by IDBI's Financial Health Card to evaluate credit-invisible MSME borrowers. Explain key metrics like BHI (Base Health Index), RAI (Risk Adjustment Index), and DTI (Data Trust Index).

`;
    }

    systemInstructions += `Strict Guidelines:
1. Always maintain a professional, analytical, and supportive banking consultant tone.
2. Rely strictly on the provided context where applicable. If the user asks about metrics not available, explain that it requires additional document parsing.
3. Be concise and keep answers structured (bullet points are welcome, but no raw markdown formatting like headers # or large bold titles; use standard bullet points).
4. Do not make up metrics.
5. Limit responses to a maximum of 180 words.`;

    if (apiKey) {
      try {
        // Convert history messages into Gemini schema
        const geminiContents = messages.map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }]
        }));

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: geminiContents,
              systemInstruction: {
                parts: [{ text: systemInstructions }]
              },
              generationConfig: {
                responseMimeType: "text/plain"
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (reply) {
            return NextResponse.json({ success: true, content: reply });
          }
        }
      } catch (err) {
        console.error("Gemini Chat API call error:", err);
      }
    }

    // Heuristic chatbot fallback if API key is not present or calls fail
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let reply = "";

    if (lastUserMessage.includes("score") || lastUserMessage.includes("why is the score")) {
      if (context && context.hasData) {
        reply = `The Financial Health Score of ${context.businessName} is calculated at ${context.financialHealthScore}/100. This is derived from a Base Health Index (BHI) of ${context.bhiScore}/100, reflecting strong operational metrics, offset by a Risk Adjustment Index (RAI) penalty of -${context.raiScore} points due to moderate transactional bounce risks.`;
      } else {
        reply = `A Financial Health Score is computed by aggregating positive operational metrics under the Base Health Index (BHI) and subtracting penalties from risk indicators under the Risk Adjustment Index (RAI). The score ranges from 0-100 and maps to loan tiers.`;
      }
    } else if (lastUserMessage.includes("optimize") || lastUserMessage.includes("improve")) {
      reply = `To optimize the score, the business should: 1. Ensure 100% on-time GST filing compliance (current: ${context?.gstCompliance || 70}%). 2. Maintain a higher average daily balance to improve banking index liquidity. 3. Stabilize UPI settlement transaction volumes and reduce UPI checkout failure rates.`;
    } else if (lastUserMessage.includes("risk") || lastUserMessage.includes("deduction")) {
      reply = `The current risk index penalty is -${context?.raiScore || 10} points. This is primarily triggered by risk factors such as ledger volatility, client concentration alerts, or minor transaction bounce rates. Mitigating these operational spikes will recover the lost points.`;
    } else if (lastUserMessage.includes("limit") || lastUserMessage.includes("exposure")) {
      if (context && context.hasData) {
        reply = `Based on a Financial Health Score of ${context.financialHealthScore}/100 and average monthly inflows, the recommended exposure is ${context.recommendedLimit} under a ${context.recommendedProduct}. This is computed dynamically using verified transactional volumes.`;
      } else {
        reply = `Recommended credit exposure is calculated based on monthly alternate ledger inflows (GST/UPI) scaled by the Financial Health Score tier. Lower-risk bands qualify for higher multiplier ratios and prime loan products.`;
      }
    } else {
      reply = `Hello! I am your IDBI Bank AI Credit Assistant. How can I help you analyze the alternate data health parameters, credit limits, or risk profiles for this MSME today?`;
    }

    return NextResponse.json({ success: true, content: reply });

  } catch (error: any) {
    console.error("Error in chat handler:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
