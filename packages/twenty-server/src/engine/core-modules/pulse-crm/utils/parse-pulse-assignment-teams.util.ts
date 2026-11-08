import { BadRequestException } from '@nestjs/common';
import { isPlainObject } from 'twenty-shared/utils';
const TEAM_ID = /^TEAM_[A-F0-9]{32}$/;
const MEMBER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const parsePulseAssignmentTeams = (input: unknown) => {
  if (!Array.isArray(input) || input.length > 100)
    throw new BadRequestException('Invalid team list.');
  const ids = new Set<string>();
  const names = new Set<string>();
  return input.map((team: unknown) => {
    if (
      !isPlainObject(team) ||
      typeof team.id !== 'string' ||
      !TEAM_ID.test(team.id) ||
      typeof team.name !== 'string' ||
      !team.name.trim() ||
      team.name.trim().length > 80 ||
      typeof team.archived !== 'boolean' ||
      !Array.isArray(team.memberIds) ||
      team.memberIds.length > 1000 ||
      team.memberIds.some(
        (id: unknown) => typeof id !== 'string' || !MEMBER_ID.test(id),
      )
    )
      throw new BadRequestException('Invalid team definition.');
    const name = team.name.trim();
    if (ids.has(team.id) || names.has(name.toLowerCase()))
      throw new BadRequestException('Team IDs and names must be unique.');
    ids.add(team.id);
    names.add(name.toLowerCase());
    return {
      id: team.id,
      name,
      memberIds: [...new Set(team.memberIds as string[])],
      archived: team.archived,
    };
  });
};
