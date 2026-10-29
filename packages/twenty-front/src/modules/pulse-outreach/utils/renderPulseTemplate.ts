const VARIABLE_PATTERN = /\{\{\s*([a-z_]+)\s*(?:\|\s*([^}]*?)\s*)?\}\}/gi;

export const PULSE_TEMPLATE_VARIABLES = [
  { name: 'first_name', label: 'First name' },
  { name: 'last_name', label: 'Last name' },
  { name: 'company', label: 'Company' },
  { name: 'sender_first_name', label: 'My first name' },
  { name: 'sender_name', label: 'My full name' },
] as const;

export type PulseTemplateContext = {
  firstName: string;
  lastName: string;
  companyName: string;
  senderFirstName: string;
  senderLastName: string;
};

// Mirrors the server renderer so previews match what gets sent.
export const renderPulseTemplate = (
  template: string,
  context: PulseTemplateContext,
) => {
  const variables: Record<string, string> = {
    first_name: context.firstName,
    last_name: context.lastName,
    full_name: [context.firstName, context.lastName].filter(Boolean).join(' '),
    company: context.companyName,
    sender_first_name: context.senderFirstName,
    sender_name: [context.senderFirstName, context.senderLastName]
      .filter(Boolean)
      .join(' '),
  };

  return template.replace(
    VARIABLE_PATTERN,
    (_, name: string, fallback?: string) => {
      const value = variables[name.toLowerCase()]?.trim();

      return value && value.length > 0 ? value : (fallback ?? '');
    },
  );
};
