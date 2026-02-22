import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ScreeningType = "BOUNTY_DESCRIPTION" | "PROPOSAL" | "EVIDENCE";

export interface ScreeningResult {
  approved: boolean;
  score: number;
  feedback: string;
  suggested_tags?: string[];
}

export class OpenClawOrchestrator {
  /**
   * Screen content based on the type using LLM
   */
  static async screen(
    type: ScreeningType,
    content: string,
    context?: any
  ): Promise<ScreeningResult> {
    const prompt = this.getPrompt(type, content, context);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are OpenClaw, an automated screening agent for the SciFlowLabs DeSci platform. Your goal is to ensure quality and prevent spam or low-effort submissions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        approved: !!result.approved,
        score: result.score || 0,
        feedback: result.feedback || "No feedback provided",
        suggested_tags: result.suggested_tags || [],
      };
    } catch (error) {
      console.error("OpenClaw screening failed:", error);
      // Fail-safe: reject for safety but provide a retryable message.
      return {
        approved: false,
        score: 0,
        feedback: "Internal screening error. Please try again later.",
      };
    }
  }

  private static getPrompt(type: ScreeningType, content: string, context?: any): string {
    switch (type) {
      case "BOUNTY_DESCRIPTION":
        return `
          Review this bounty description for clarity, scientific merit, and completeness.
          Bounty Content: ${content}
          
          Return JSON:
          {
            "approved": boolean,
            "score": number (0-100),
            "feedback": "detailed review string",
            "suggested_tags": ["tag1", "tag2"]
          }
        `;
      case "PROPOSAL":
        return `
          Review this proposal for a bounty. Check if it matches the bounty requirements and if the researcher has provided a clear plan.
          Bounty Requirements: \${context?.bountyDescription || "N/A"}
          Proposal Content: ${content}
          
          Return JSON:
          {
            "approved": boolean,
            "score": number (0-100),
            "feedback": "detailed feedback for the researcher"
          }
        `;
      case "EVIDENCE":
        return `
          Review this evidence submission for a milestone. Check for proof of work, scientific data, or results.
          Milestone Title: \${context?.milestoneTitle || "N/A"}
          Evidence Description: ${content}
          
          Return JSON:
          {
            "approved": boolean,
            "score": number (0-100),
            "feedback": "detailed feedback"
          }
        `;
      default:
        return "Please review the content.";
    }
  }
}
