import { renderPulseTemplate } from '@/pulse-outreach/utils/renderPulseTemplate';

describe('renderPulseTemplate', () => {
  const context = {
    firstName: 'Qawi',
    lastName: '',
    companyName: 'Nexlink Capital',
    senderFirstName: 'Hamza',
    senderLastName: 'Khan',
  };

  it('fills variables and fallbacks the same way the server does', () => {
    expect(
      renderPulseTemplate(
        'Hi {{first_name}} {{last_name|}}at {{company}} - {{sender_name}}',
        context,
      ),
    ).toBe('Hi Qawi at Nexlink Capital - Hamza Khan');
  });
});
