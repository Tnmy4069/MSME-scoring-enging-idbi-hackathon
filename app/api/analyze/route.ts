import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, fileName, documentType, mockProfile, customApiKey } = body;

    // Determine the API Key to use (prioritize user input, then environment variable)
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    // Define mock profiles for fallback and default demonstration
    const MOCK_PROFILES: Record<string, Record<string, any>> = {
      healthy: {
        gst: { turnover: 25000000, growth: 25.0, compliance: 100 },
        upi: { annualInflow: 18000000, transactions: 32500, failedTransactions: 0.5 },
        bank: { averageBalance: 1250000, emiBurden: "Low", cashFlowStability: "High" },
        epfo: { employees: 75, employeeGrowth: 22.4 },
        companyName: "Vikas Industries Limited",
        riskScore: 10, // low risk penalty
      },
      medium: {
        gst: { turnover: 12400000, growth: 18.0, compliance: 70 }, // Starting compliance at 70% so they can simulate improving it!
        upi: { annualInflow: 9840000, transactions: 18240, failedTransactions: 1.2 },
        bank: { averageBalance: 485000, emiBurden: "Low", cashFlowStability: "High" },
        epfo: { employees: 42, employeeGrowth: 16.7 },
        companyName: "Kiran Enterprise Pvt Ltd",
        riskScore: 45, // medium risk penalty
      },
      high: {
        gst: { turnover: 4500000, growth: -5.0, compliance: 60 },
        upi: { annualInflow: 2250000, transactions: 4200, failedTransactions: 4.8 },
        bank: { averageBalance: 48000, emiBurden: "High", cashFlowStability: "Low" },
        epfo: { employees: 8, employeeGrowth: -12.0 },
        companyName: "Apex Retailers Ltd",
        riskScore: 80, // high risk penalty
      }
    };

    // If a specific mock profile is selected, instantly return it
    if (mockProfile && MOCK_PROFILES[mockProfile]) {
      const profile = MOCK_PROFILES[mockProfile];
      return NextResponse.json({
        success: true,
        isMock: true,
        source: `Demo Profile: ${mockProfile}`,
        documentType,
        companyName: profile.companyName,
        extractedData: profile[documentType] || {}
      });
    }

    // Attempt to use Gemini if the API key is present
    if (apiKey) {
      try {
        const prompt = `You are an expert credit underwriting parser for IDBI Bank.
Analyze the following text content extracted from an MSME alternate financial document of type "${documentType}" (which represents one of: gst, upi, bank, or epfo).
Extract and estimate the key underwriting metrics as a JSON object.

Based on the document type, extract the following:
1. If GST (gst):
   - companyName (string, name of company if found, otherwise a realistic default)
   - turnover (number in rupees, annual, e.g. 12400000)
   - growth (number as percentage, e.g. 18.0)
   - compliance (number as percentage 0-100, e.g. 70 or 100)
2. If UPI (upi):
   - companyName (string, name of company if found)
   - annualInflow (number in rupees, e.g. 9840000)
   - transactions (number, e.g. 18240)
   - failedTransactions (number as percentage 0-100, e.g. 1.2)
3. If Bank (bank):
   - companyName (string, name of company if found)
   - averageBalance (number in rupees, monthly, e.g. 485000)
   - emiBurden (string: "Low" | "Medium" | "High")
   - cashFlowStability (string: "High" | "Medium" | "Low")
4. If EPFO (epfo):
   - companyName (string, name of company if found)
   - employees (number, headcount, e.g. 42)
   - employeeGrowth (number as percentage, e.g. 16.7)

Ensure the response contains a JSON object matching this structure EXACTLY. Return ONLY the relevant keys under 'extractedData' for the given documentType, plus 'companyName' and 'documentType' at the root:
{
  "documentType": "${documentType}",
  "companyName": "Company Name Extracted",
  "extractedData": {
    // ONLY include the properties relevant for the requested documentType: ${documentType}
  }
}

Do not include any explanation, markdown formatting, or HTML tags. Just the raw JSON content.
Here is the document text:
---
${text || ""}
---`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
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
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const parsed = JSON.parse(responseText.trim());
            return NextResponse.json({
              success: true,
              isMock: false,
              source: "Gemini 1.5 Flash",
              ...parsed
            });
          }
        } else {
          console.error("Gemini API call failed, falling back to mock", await response.text());
        }
      } catch (geminiError) {
        console.error("Error calling Gemini API:", geminiError);
        // continue to mock fallback
      }
    }

    // ─── Rule-Based/Mock Fallback ───
    // Check text/filename to see if we should match a profile, otherwise generate realistic values
    let detectedProfile = "medium";
    const combinedInput = `${text} ${fileName} ${documentType}`.toLowerCase();
    if (combinedInput.includes("healthy") || combinedInput.includes("vikas") || combinedInput.includes("prime")) {
      detectedProfile = "healthy";
    } else if (combinedInput.includes("high") || combinedInput.includes("apex") || combinedInput.includes("risk") || combinedInput.includes("critical")) {
      detectedProfile = "high";
    }

    const matchedProfile = MOCK_PROFILES[detectedProfile];
    const dataForType = matchedProfile[documentType] || {};

    // Add small random noise to simulated data to make it feel organic if user uploaded files
    const finalData = { ...dataForType };
    if (!mockProfile && text) {
      if (documentType === "gst") {
        finalData.turnover = Math.round(dataForType.turnover * (0.95 + Math.random() * 0.1));
        finalData.growth = Number((dataForType.growth + (Math.random() * 2 - 1)).toFixed(1));
      } else if (documentType === "upi") {
        finalData.annualInflow = Math.round(dataForType.annualInflow * (0.95 + Math.random() * 0.1));
        finalData.transactions = Math.round(dataForType.transactions * (0.95 + Math.random() * 0.1));
      } else if (documentType === "bank") {
        finalData.averageBalance = Math.round(dataForType.averageBalance * (0.95 + Math.random() * 0.1));
      } else if (documentType === "epfo") {
        finalData.employees = Math.round(dataForType.employees + (Math.random() > 0.5 ? 1 : -1));
        finalData.employeeGrowth = Number((dataForType.employeeGrowth + (Math.random() * 2 - 1)).toFixed(1));
      }
    }

    return NextResponse.json({
      success: true,
      isMock: true,
      source: "Underwriting Parser Fallback (Heuristic)",
      documentType,
      companyName: matchedProfile.companyName,
      extractedData: finalData
    });

  } catch (error: any) {
    console.error("Server API Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "An unexpected error occurred"
    }, { status: 500 });
  }
}
