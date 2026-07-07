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

    systemInstructions += `Guidelines:
1. Maintain a professional, helpful, and supportive banking assistant tone.
2. If the user asks about the active MSME or credit evaluation, utilize the provided data context.
3. If the user asks general questions, casual questions, coding questions, general finance queries, or anything else, answer them fully and intelligently. Do NOT restrict yourself to only the MSME context when answering general topics.
4. Keep answers concise, clear, and well-structured.
5. Limit response length to a maximum of 250 words.`;

    if (apiKey) {
      try {
        // Convert history messages into Gemini schema
        const geminiContents = messages.map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }]
        }));

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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

    const msg = lastUserMessage.toLowerCase();
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
      reply = `Hello! I am your IDBI Bank Underwriting AI Assistant. I can help you analyze credit health parameters, explain score details, and review risk metrics. What would you like to know?`;
    } else if (msg.includes("score") || msg.includes("why is the score")) {
      if (context && context.hasData) {
        reply = `The Financial Health Score of ${context.businessName} is calculated at ${context.financialHealthScore}/100. This is derived from a Base Health Index (BHI) of ${context.bhiScore}/100, reflecting strong operational metrics, offset by a Risk Adjustment Index (RAI) penalty of -${context.raiScore} points due to moderate transactional bounce risks.`;
      } else {
        reply = `A Financial Health Score is computed by aggregating positive operational metrics under the Base Health Index (BHI) and subtracting penalties from risk indicators under the Risk Adjustment Index (RAI). The score ranges from 0-100 and maps to loan tiers.`;
      }
    } else if (msg.includes("optimize") || msg.includes("improve")) {
      reply = `To optimize the score, the business should: 1. Ensure 100% on-time GST filing compliance (current: ${context?.gstCompliance || 70}%). 2. Maintain a higher average daily balance to improve banking index liquidity. 3. Stabilize UPI settlement transaction volumes and reduce UPI checkout failure rates.`;
    } else if (msg.includes("risk") || msg.includes("deduction")) {
      reply = `The current risk index penalty is -${context?.raiScore || 10} points. This is primarily triggered by risk factors such as ledger volatility, client concentration alerts, or minor transaction bounce rates. Mitigating these operational spikes will recover the lost points.`;
    } else if (msg.includes("limit") || msg.includes("exposure")) {
      if (context && context.hasData) {
        reply = `Based on a Financial Health Score of ${context.financialHealthScore}/100 and average monthly inflows, the recommended exposure is ${context.recommendedLimit} under a ${context.recommendedProduct}. This is computed dynamically using verified transactional volumes.`;
      } else {
        reply = `Recommended credit exposure is calculated based on monthly alternate ledger inflows (GST/UPI) scaled by the Financial Health Score tier. Lower-risk bands qualify for higher multiplier ratios and prime loan products.`;
      }
    } else if (msg.includes("what is") || msg.includes("define") || msg.includes("explain")) {
      if (msg.includes("gst")) {
        reply = `GST (Goods and Services Tax) data is used to verify the sales turnover, growth trajectory, and tax filing compliance of the business. Steady filings denote operational stability.`;
      } else if (msg.includes("upi")) {
        reply = `UPI transaction volume and consistency reflect granular merchant settlement velocity. High bounce rates or failed transaction ratios are flagged as risk indicators.`;
      } else if (msg.includes("epfo")) {
        reply = `EPFO (Employees' Provident Fund Organisation) records verify the official payroll size and headcount trends of the business. Consistent or growing employment is a strong stability indicator.`;
      } else if (msg.includes("bhi")) {
        reply = `The Base Health Index (BHI) is a positive scoring index (max 100 points) evaluating revenue quality, cash flow, growth potential, compliance, and stability.`;
      } else if (msg.includes("rai")) {
        reply = `The Risk Adjustment Index (RAI) is a penalty index (max 30 points) triggered by alerts like high bounce rates, volatile sales, or supplier dependency.`;
      } else if (msg.includes("dti")) {
        reply = `The Data Trust Index (DTI) represents the reliability and integrity of the alternate data sources connected (GST, UPI, EPFO, Banking).`;
      } else {
        reply = `I can explain key parameters like GST, UPI, EPFO, BHI, RAI, or DTI. Which one would you like to explore?`;
      }
    } else if (msg.includes("help") || msg.includes("capabilities")) {
      reply = `I can: 1. Explain the score calculation. 2. Highlight positive and negative risk factors. 3. Suggest score optimization steps. 4. Answer alternate data underwriting questions.`;
    } else if (msg.includes("calculator") || msg.includes("calculate")) {
      reply = `The score is calculated as: Final Score = Base Health Index (BHI) - Risk Adjustment Index (RAI). BHI measures alternate data performance, and RAI penalizes transaction anomalies.`;
    } else if (msg.includes("joke")) {
      reply = `Why did the bank teller get promoted? Because they showed outstanding interest!`;
    } else if (msg.includes("capital of india") || msg.includes("delhi")) {
      reply = `The capital of India is New Delhi. Let me know if you want to analyze alternate data credit health scores for Indian MSMEs!`;
    } else {
      reply = `I understand you are asking about "${messages[messages.length - 1]?.content}". In demo mode (using default local heuristics), I can assist with credit assessments, GST/UPI insights, risk penalties, and optimization paths. To activate the full range of custom Gemini AI conversations, please configure a valid Google Gemini API Key in the project's .env file.`;
    }

    return NextResponse.json({ success: true, content: reply });

  } catch (error: any) {
    console.error("Error in chat handler:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
