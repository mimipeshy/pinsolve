import Anthropic from "@anthropic-ai/sdk";

const anthropic= new Anthropic();

export async function POST(request: Request){
    try{
        const body= await request.json();
        const {
            productName,
            productAnalysis,
            targetAudience,
            chosenAngle,
            selectedKeywords,
        }= body;

        //validate incoming data
        if(!productName || !productAnalysis || !chosenAngle){
            return Response.json(
                {
                    success: false,
                    message:"Product name, product analysis and selected marketing angle are required",
                },
                {status: 400}
            );
        }
        if(
            !Array.isArray(selectedKeywords) ||
            selectedKeywords.length ===0
        ) {
            return Response.json(
                {
                    success:false,
                    message: "Please select atleast one Pinterest keyword."
                },{status:400}
            );
        }
       
    const prompt = `
You are an expert Pinterest SEO strategist and creative copywriter.

Your task is to create Pinterest content for a product using the selected marketing angle and the keywords approved by the user.

PRODUCT NAME:
${productName}

PRODUCT ANALYSIS:
${productAnalysis}

TARGET AUDIENCE:
${targetAudience || chosenAngle.target_audience || "Use the audience identified in the product analysis."}

SELECTED MARKETING ANGLE:
${chosenAngle.angle_name}

ANGLE TYPE:
${chosenAngle.angle_type}

ANGLE TARGET AUDIENCE:
${chosenAngle.target_audience}

AUDIENCE MOTIVATION:
${chosenAngle.audience_motivation}

MARKETING MESSAGE:
${chosenAngle.marketing_message}

ORIGINAL PIN HOOK:
${chosenAngle.pinterest_hook}

USER-APPROVED PINTEREST KEYWORDS:
${selectedKeywords.map((keyword: string) => `- ${keyword}`).join("\n")}

CONTENT REQUIREMENTS:

1. KEYWORD STRATEGY

The user has already reviewed and selected the keywords.

Do not replace the user's keyword strategy with a new one.

Use the supplied keywords to guide the content.

Identify the strongest selected keyword as the primary keyword.
Use other selected keywords as secondary or supporting phrases where relevant.

Prioritize natural Pinterest search intent.

Do not invent search volume, competition data or trending claims.

2. PIN TITLE

- Build the title around the strongest relevant selected keyword.
- Whenever possible, place the primary keyword near the beginning.
- Integrate another selected keyword only when it fits naturally.
- Make the title descriptive, specific and searchable.
- Communicate what the user will discover.
- Avoid vague, generic or clickbait titles.
- Do not sacrifice readability to squeeze in keywords.
- Never keyword-stuff.
- Do not introduce unrelated keywords.

A title should feel like something that matches what a Pinterest user is searching for.

For example, instead of:
"Your Bathroom, But Make It a Sanctuary"

Prefer:
"Soft Bath Towels for Everyday Use | Spa Bathroom Ideas at Home"

The example is illustrative. Generate titles relevant to the actual product, approved keywords and selected marketing angle.

3. PIN DESCRIPTION

- Write a natural, helpful Pinterest description.
- Include the primary keyword naturally.
- Integrate other selected keywords where relevant.
- Keywords must fit naturally into sentences and must never appear as an awkward keyword list.
- Maintain the selected marketing angle and its emotional appeal.
- Explain how the product connects to the audience's needs, interests or lifestyle.
- Write for both Pinterest discovery and human readers.
- Do not keyword-stuff.
- Do not invent product features, specifications, certifications, claims or guarantees.

4. KEYWORDS

- Return the user's selected keywords in the keywords array.
- Keep the most important keyword first.
- Preserve the user's keyword choices.
- Do not invent additional keywords.
- Do not include hashtags.
- You may organize the keywords by relevance, but do not remove selected keywords.

5. CTA

- Create a short, natural call to action.
- Encourage further exploration or action.
- Avoid aggressive or misleading sales language.

6. PIN HOOK

- Create a short headline suitable for text displayed directly on the Pinterest image.
- Make it attention-grabbing, readable and relevant to the selected marketing angle.
- Aim for 3 to 8 words.
- The image hook does not need to repeat the title word for word.
- Prioritize visual impact and curiosity over SEO.

7. QUALITY CONTROL

Before returning the content, verify that:

- The title targets a clear search intent.
- The title uses a selected keyword naturally.
- The title is descriptive and not unnecessarily generic.
- The description contains relevant selected search phrases naturally.
- Keywords are not forced or repeated unnaturally.
- All content aligns with the selected marketing angle.
- All factual product claims are supported by the supplied product information.
- The title, description, keywords and pin hook complement one another rather than repeating the same sentence.

8. OUTPUT FORMAT

Return valid JSON only.

Do not wrap the JSON in Markdown code fences.
Do not include explanations before or after the JSON.
Do not include any additional properties.

Use exactly this structure:

{
  "pin_title": "Pinterest title",
  "pin_description": "Pinterest description",
  "keywords": ["keyword 1", "keyword 2"],
  "cta": "Call to action",
  "pin_hook": "Short image hook"
}
`;
        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1200,
            messages : [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        const textBlock = response.content.find(
            (block) => block.type === "text"
        );
        if(!textBlock){
            throw new Error ("Claude did not return Pinterest content.");
        }
        //remove markdown code fences if claude includes them
        const cleanedText = textBlock.text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

        const pinterestContent = JSON.parse(cleanedText);
        //validae the returned content
        if(
            !pinterestContent.pin_title ||
            !pinterestContent.pin_description ||
            !Array.isArray(pinterestContent.keywords) ||
            !pinterestContent.cta ||
            !pinterestContent.pin_hook
        ){
            throw new Error("Claude returned incomplete Pinterest content.")
        }
        return Response.json({
            success: true,
            pinterestContent
        });
    } catch (error){
        console.error("Pintrest content generation error:", error);
        return Response.json(
            {
                success: false,
                message: "Failed to generate Pinterest content."
            },
            {status: 500}
        );
    }
}