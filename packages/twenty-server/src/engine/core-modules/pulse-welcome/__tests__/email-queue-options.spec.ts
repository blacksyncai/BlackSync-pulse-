import { EmailService } from '../../email/email.service';
import { EMAIL_SEND_RETRY_BACKOFF } from '../../email/constants/email-send-retry-backoff.constant';
describe('welcome queue options', () => {
  it('retains normal email retries and adds optional deduplication', async () => {
    const queue = { add: jest.fn().mockResolvedValue('job') };
    const service = new EmailService(queue as never);
    const message = {
      to: 'member@example.com',
      subject: 'Welcome',
      text: 'Welcome',
    };
    await service.send(message, {
      id: 'welcome-user',
      deduplication: { id: 'welcome-user' },
    });
    expect(queue.add).toHaveBeenCalledWith('EmailSenderJob', message, {
      id: 'welcome-user',
      deduplication: { id: 'welcome-user' },
      retryLimit: 3,
      backoff: EMAIL_SEND_RETRY_BACKOFF,
    });
  });
  it('preserves the existing options for account, invite and reminder emails', async () => {
    const queue = { add: jest.fn().mockResolvedValue('job') };
    const service = new EmailService(queue as never);
    const message = { to: 'member@example.com', text: 'Reset password' };
    await service.send(message);
    expect(queue.add).toHaveBeenCalledWith('EmailSenderJob', message, {
      retryLimit: 3,
      backoff: EMAIL_SEND_RETRY_BACKOFF,
    });
  });
});
