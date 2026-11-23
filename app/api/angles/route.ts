import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

 
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const productName = body.productName?.trim();
    const productAnalysis = body.productAnalysis?.trim();
    const targetAudience = body.targetAudience?.trim() || "Not specified";

    if (!productName || !productAnalysis) {
      return Response.json(
        {
          success: false,
          message: "Product name and approved product analysis are required.",
        },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are a Pinterest marketing strategist.

Create exactly 3 distinct marketing angles for the following product.

PRODUCT NAME:
${productName}

APPROVED PRODUCT ANALYSIS:
${productAnalysis}

TARGET AUDIENCE:
${targetAudience}

Create exactly these 3 types of marketing angles:

1. Problem-focused
   Focus on a problem, frustration, need, or situation the product can help address.

2. Lifestyle-focused
   Sell the lifestyle, experience, mood, identity, or moment associated with using the product.
   Do not simply list product features.

3. Benefit-focused
   Highlight the practical or emotional value the customer gains from the product.

IMPORTANT RULES:

- Use the approved product analysis as your source of truth.
- Do not invent product features, specifications, materials, capabilities, or performance claims.
- Do not exaggerate benefits.
- Make the 3 angles genuinely different from one another.
- Think like a Pinterest marketer: focus on visual storytelling and the customer's motivation.
- The lifestyle angle should sell the experience rather than the product specifications.
- Make the marketing messages specific to this product.
- Do not generate Pinterest titles, descriptions, hashtags, or image prompts yet.

Return ONLY valid JSON in this exact structure:

{
  "angles": [
    {
      "angle_type": "problem-focused",
      "angle_name": "",
      "target_audience": "",
      "audience_motivation": "",
      "marketing_message": "",
      "pinterest_hook": ""
    },
    {
      "angle_type": "lifestyle-focused",
      "angle_name": "",
      "target_audience": "",
      "audience_motivation": "",
      "marketing_message": "",
      "pinterest_hook": ""
    },
    {
      "angle_type": "benefit-focused",
      "angle_name": "",
      "target_audience": "",
      "audience_motivation": "",
      "marketing_message": "",
      "pinterest_hook": ""
    }
  ]
}`,
        },
      ],
    });

    const textBlock = response.content.find(
      (block) => block.type === "text"
    );

    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Claude did not return a text response.");
    }

    const cleanedText = textBlock.text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "")
        .trim();
    const result = JSON.parse(cleanedText);

    return Response.json({
      success: true,
      marketingAngles: result.angles,
    });
  } catch (error) {
    console.error("Marketing angle generation error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to generate marketing angles.",
      },
      { status: 500 }
    );
  }
}
