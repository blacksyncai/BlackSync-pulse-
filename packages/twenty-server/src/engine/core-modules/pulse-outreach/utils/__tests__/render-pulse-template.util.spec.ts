import {
  buildTemplateVariables,
  plainTextToEmailHtml,
  renderPulseTemplate,
} from 'src/engine/core-modules/pulse-outreach/utils/render-pulse-template.util';

describe('renderPulseTemplate', () => {
  const variables = buildTemplateVariables(
    { firstName: 'Qawi', lastName: 'Alamin', companyName: 'Nexlink Capital' },
    { firstName: 'Hamza', lastName: 'Khan' },
  );

  it('fills contact, company and sender variables', () => {
    expect(
      renderPulseTemplate(
        'Hi {{first_name}}, quick question about {{ company }}. - {{sender_first_name}}',
        variables,
      ),
    ).toBe('Hi Qawi, quick question about Nexlink Capital. - Hamza');
  });

  it('uses the fallback when a value is missing', () => {
    expect(
      renderPulseTemplate(
        'Hi {{first_name|there}}',
        buildTemplateVariables(
          { firstName: '', lastName: '', companyName: '' },
          { firstName: 'Hamza', lastName: '' },
        ),
      ),
    ).toBe('Hi there');
  });

  it('turns paragraphs into escaped html', () => {
    expect(plainTextToEmailHtml('Hi <b>\nthere\n\nBye')).toContain(
      '<p style="margin:0 0 12px">Hi &lt;b&gt;<br>there</p><p style="margin:0 0 12px">Bye</p>',
    );
  });
});
