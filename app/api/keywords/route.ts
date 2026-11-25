
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  try {
    const {
      productName,
      productAnalysis,
      targetAudience,
      chosenAngle,
    } = await request.json();

    if (!productName || !productAnalysis || !chosenAngle) {
      return Response.json(
        {
          success: false,
          message: "Missing required product or marketing information.",
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
          content: `You are a Pinterest SEO strategist specializing in product marketing, lifestyle content, and Pinterest search intent.

Your task is to generate exactly 12 diverse keyword candidates for a Pinterest marketing campaign.

PRODUCT:
${productName}

PRODUCT ANALYSIS:
${productAnalysis}

TARGET AUDIENCE:
${targetAudience || "Identify the most relevant audience from the product information."}

SELECTED MARKETING ANGLE:
${JSON.stringify(chosenAngle, null, 2)}

KEYWORD DISTRIBUTION:
- 3 product-specific keywords
- 3 aesthetic and inspiration keywords
- 2 lifestyle keywords
- 2 problem-solving keywords
- 2 long-tail keywords

REQUIREMENTS:
1. Generate exactly 12 unique keyword phrases.
2. Keywords must be relevant to the product and selected marketing angle.
3. Prioritize Pinterest-style searches, including aesthetics, inspiration, lifestyle, and discovery.
4. Include a natural mix of broad and specific search phrases.
5. Avoid repetitive variations of the same keyword.
6. Do not invent product specifications or features.
7. Do not claim that keywords have verified search volume, popularity, competition, or trend data.
8. Each keyword must have a clear category and a short explanation of why it is useful.
9. Recommend the strongest 6 keywords for the selected marketing angle.
10. The recommended keywords should form a balanced combination, not simply the six most similar phrases.

CATEGORY VALUES:
- product
- aesthetic
- lifestyle
- problem_solution
- long_tail

Return ONLY valid JSON using this exact structure:

{
  "keywords": [
    {
      "keyword": "keyword phrase",
      "category": "product",
      "reason": "Why this keyword is relevant",
      "recommended": true
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
      throw new Error("No keyword suggestions were generated.");
    }

   let responseText = textBlock.text.trim();

// Remove Markdown code fences if Claude included them
responseText = responseText
  .replace(/^```json\s*/i, "")
  .replace(/^```\s*/i, "")
  .replace(/\s*```$/i, "")
  .trim();

  const result = JSON.parse(responseText);

    if (!Array.isArray(result.keywords) || result.keywords.length !== 12) {
      throw new Error("AI returned an invalid keyword list.");
    }

    return Response.json({
      success: true,
      keywords: result.keywords,
    });
  } catch (error) {
    console.error("Keyword generation error:", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error occurred.",
      },
      { status: 500 }
    );
  }

}