export const ONBOARDING_NETWORK_PREVIEW_PEOPLE = [3, 5, 22, 20, 34].map(
  (imageNumber, index) => ({
    id: `network-preview-person-${imageNumber}`,
    avatarUrl: `/images/landing/avatar-${(index % 4) + 1}.jpg`,
  }),
);
