import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { IngestPulseCallDto } from 'src/engine/api/rest/core/dtos/ingest-pulse-call.dto';

const VALID_CALL = {
  source: 'external-dialer',
  externalId: 'call-123',
  phoneNumber: '+15551234567',
  direction: 'inbound',
  durationSeconds: 120,
  outcome: 'answered',
  personId: '1066b48e-11fd-4af8-8f6f-f6afea47cc21',
};
const pipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});
const parse = (payload: unknown) =>
  pipe.transform(payload, { type: 'body', metatype: IngestPulseCallDto });

describe('external call payload validation', () => {
  it('accepts a completed call with summary, transcript, and an HTTPS recording', async () => {
    await expect(
      parse({
        ...VALID_CALL,
        summary: 'Follow up next week',
        transcript: 'Agent: Hello',
        recordingUrl: 'https://recordings.example.com/call.mp3',
      }),
    ).resolves.toMatchObject(VALID_CALL);
  });
  it.each([
    { durationSeconds: -1 },
    { durationSeconds: 1.5 },
    { durationSeconds: '120' },
    { direction: 'unknown' },
    { outcome: 'done' },
    { phoneNumber: '5551234567' },
    { personId: 'not-a-uuid' },
    { companyId: 'not-a-uuid' },
    { source: 'bad\nsource' },
    { externalId: '' },
    { recordingUrl: 'http://recordings.example.com/call.mp3' },
    { recordingUrl: 'https://recordings.example.com/call).mp3' },
    { workspaceId: 'injected-workspace' },
    { transcript: 'a'.repeat(100001) },
  ])('rejects invalid or extra input %j', async (patch) => {
    await expect(parse({ ...VALID_CALL, ...patch })).rejects.toThrow();
  });
});
