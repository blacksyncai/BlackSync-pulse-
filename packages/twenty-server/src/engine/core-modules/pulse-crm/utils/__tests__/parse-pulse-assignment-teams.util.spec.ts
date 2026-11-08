import { parsePulseAssignmentTeams } from '../parse-pulse-assignment-teams.util';
const team = {
  id: 'TEAM_0123456789ABCDEF0123456789ABCDEF',
  name: ' Sales ',
  memberIds: ['00000000-0000-4000-8000-000000000001'],
  archived: false,
};
describe('assignment team validation', () => {
  it('normalizes names, deduplicates members, and drops unknown properties', () =>
    expect(
      parsePulseAssignmentTeams([
        {
          ...team,
          memberIds: [...team.memberIds, ...team.memberIds],
          role: 'admin',
        },
      ]),
    ).toEqual([{ ...team, name: 'Sales' }]));
  it.each([
    null,
    {},
    [{ ...team, id: 'bad' }],
    [{ ...team, name: '' }],
    [{ ...team, name: 'x'.repeat(81) }],
    [{ ...team, memberIds: ['outside'] }],
    [{ ...team, archived: 'false' }],
    Array(101).fill(team),
  ])('rejects malformed or oversized input %#', (input) =>
    expect(() => parsePulseAssignmentTeams(input)).toThrow(),
  );
  it('rejects duplicate identifiers and case-insensitive names', () => {
    expect(() => parsePulseAssignmentTeams([team, team])).toThrow();
    expect(() =>
      parsePulseAssignmentTeams([
        team,
        { ...team, id: 'TEAM_1123456789ABCDEF0123456789ABCDEF', name: 'sales' },
      ]),
    ).toThrow();
  });
  it('preserves archived teams and empty memberships', () =>
    expect(
      parsePulseAssignmentTeams([
        { ...team, memberIds: [], archived: true },
      ])[0],
    ).toMatchObject({ memberIds: [], archived: true }));
});
