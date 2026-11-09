import { BadRequestException } from '@nestjs/common';

export type TicketEmailRule = {
  channelId: string;
  enabled: boolean;
  keywords: string[];
  enabledAt: string;
  cursorAt: string;
  cursorId: string;
  userId: string;
  userWorkspaceId: string;
};

export const parseTicketEmailRule = (
  input: unknown,
): Pick<TicketEmailRule, 'channelId' | 'enabled' | 'keywords'> => {
  if (!input || typeof input !== 'object')
    throw new BadRequestException('Invalid email rule.');
  const rule = input as Record<string, unknown>;
  if (
    typeof rule.channelId !== 'string' ||
    !/^[0-9a-f-]{36}$/i.test(rule.channelId) ||
    typeof rule.enabled !== 'boolean' ||
    !Array.isArray(rule.keywords) ||
    rule.keywords.length < 1 ||
    rule.keywords.length > 20 ||
    rule.keywords.some(
      (word) =>
        typeof word !== 'string' || word.trim().length < 2 || word.length > 80,
    )
  )
    throw new BadRequestException(
      'Choose a mailbox and 1–20 subject keywords, each 2–80 characters.',
    );
  return {
    channelId: rule.channelId,
    enabled: rule.enabled,
    keywords: [
      ...new Set(
        (rule.keywords as string[]).map((word) => word.trim().toLowerCase()),
      ),
    ],
  };
};

export const matchesTicketEmail = (
  subject: string,
  receivedAt: Date | null,
  rule: Pick<TicketEmailRule, 'keywords' | 'enabledAt' | 'enabled'>,
) =>
  rule.enabled &&
  receivedAt !== null &&
  receivedAt.getTime() >= Date.parse(rule.enabledAt) &&
  rule.keywords.some((keyword) => subject.toLowerCase().includes(keyword));
