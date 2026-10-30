import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const SUMMARY_MODEL = 'claude-haiku-5-5';
// Long calls are trimmed so a summary stays fast and cheap; the start and end of a
// call carry most of its outcome.
const MAX_TRANSCRIPT_CHARACTERS = 60_000;

const SUMMARY_INSTRUCTIONS = `You summarize sales calls for a CRM timeline.
Write 3 to 6 short bullet points, each starting with "- ", covering what was discussed, concerns or objections, what was agreed, and the next step with any date or time mentioned.
Refer to people by name when the transcript makes names clear. Be factual and concise. Output only the bullets.`;

type AnthropicMessageResponse = {
  content?: { type: string; text?: string }[];
};

@Injectable()
export class PulseCallSummaryService {
  private readonly logger = new Logger(PulseCallSummaryService.name);

  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  canSummarize() {
    return isNonEmptyString(this.twentyConfigService.get('ANTHROPIC_API_KEY'));
  }

  async summarize(transcript: string): Promise<string | null> {
    const apiKey = this.twentyConfigService.get('ANTHROPIC_API_KEY');

    if (!isNonEmptyString(apiKey) || transcript.trim().length === 0) {
      return null;
    }

    const trimmed =
      transcript.length > MAX_TRANSCRIPT_CHARACTERS
        ? `${transcript.slice(0, MAX_TRANSCRIPT_CHARACTERS / 2)}\n…\n${transcript.slice(-MAX_TRANSCRIPT_CHARACTERS / 2)}`
        : transcript;

    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: SUMMARY_MODEL,
        max_tokens: 600,
        system: SUMMARY_INSTRUCTIONS,
        messages: [{ role: 'user', content: `Call transcript:\n\n${trimmed}` }],
      }),
    });

    if (!response.ok) {
      this.logger.warn(
        `Call summary failed with ${response.status}: ${(await response.text()).slice(0, 200)}`,
      );

      return null;
    }

    const message = (await response.json()) as AnthropicMessageResponse;
    const text = (message.content ?? [])
      .map((block) => block.text ?? '')
      .join('')
      .trim();

    return text.length > 0 ? text : null;
  }
}
