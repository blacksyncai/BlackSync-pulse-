import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

export type PulseLeadRow = {
  id: string;
  name: string | null;
  domain: string | null;
  leadStatus: string | null;
  ownerId: string | null;
  createdAt: string;
  contactCount: number;
  primaryContact: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  lastActivityAt: string | null;
  lastActivityTitle: string | null;
  lastCallAt: string | null;
  callCount: number;
  nextTaskAt: string | null;
  openTaskCount: number;
  dealCount: number;
  dealValueMicros: number;
};

const CALL_TITLE_PATTERN = '%call ·%';
// The lead summary written by the Close import is not a touch.
const IMPORT_SUMMARY_TITLE = 'Imported from Close';

// One query computes the activity rollups a sales list needs, which would otherwise
// take thousands of per-record lookups from the browser.
@Injectable()
export class PulseLeadsService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async listLeads(workspaceId: string): Promise<PulseLeadRow[]> {
    const schema = getWorkspaceSchemaName(workspaceId);
    const quotedSchema = `"${schema.replace(/"/g, '')}"`;
    const [{ hasLeadStatus }] = await this.coreDataSource.query<
      { hasLeadStatus: boolean }[]
    >(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = 'company' AND column_name = 'leadStatus'
       ) AS "hasLeadStatus"`,
      [schema],
    );
    const leadStatusColumn = hasLeadStatus
      ? 'c."leadStatus"::text'
      : 'NULL::text';

    const rows = await this.coreDataSource.query<PulseLeadRow[]>(
      `WITH people AS (
         SELECT p."companyId" AS company_id,
           count(*)::int AS contact_count,
           (array_agg(json_build_object(
             'id', p.id,
             'firstName', p."nameFirstName",
             'lastName', p."nameLastName",
             'email', NULLIF(p."emailsPrimaryEmail", ''),
             'phone', NULLIF(concat(p."phonesPrimaryPhoneCallingCode", p."phonesPrimaryPhoneNumber"), '')
           ) ORDER BY p."createdAt"))[1] AS primary_contact
         FROM ${quotedSchema}.person p
         WHERE p."deletedAt" IS NULL AND p."companyId" IS NOT NULL
         GROUP BY p."companyId"
       ),
       note_links AS (
         SELECT COALESCE(nt."targetCompanyId", tp."companyId") AS company_id,
           n.id, n."createdAt", n.title
         FROM ${quotedSchema}."noteTarget" nt
         JOIN ${quotedSchema}.note n ON n.id = nt."noteId" AND n."deletedAt" IS NULL
         LEFT JOIN ${quotedSchema}.person tp ON tp.id = nt."targetPersonId"
         WHERE nt."deletedAt" IS NULL
       ),
       notes AS (
         SELECT company_id,
           max("createdAt") AS last_activity,
           (array_agg(title ORDER BY "createdAt" DESC))[1] AS last_title,
           max("createdAt") FILTER (WHERE title ILIKE $1) AS last_call,
           count(DISTINCT id) FILTER (WHERE title ILIKE $1)::int AS call_count
         FROM note_links
         WHERE company_id IS NOT NULL AND title <> $2
         GROUP BY company_id
       ),
       tasks AS (
         SELECT COALESCE(tt."targetCompanyId", tp."companyId") AS company_id,
           min(t."dueAt") FILTER (WHERE t.status IS DISTINCT FROM 'DONE') AS next_task,
           count(DISTINCT t.id) FILTER (WHERE t.status IS DISTINCT FROM 'DONE')::int AS open_tasks
         FROM ${quotedSchema}."taskTarget" tt
         JOIN ${quotedSchema}.task t ON t.id = tt."taskId" AND t."deletedAt" IS NULL
         LEFT JOIN ${quotedSchema}.person tp ON tp.id = tt."targetPersonId"
         WHERE tt."deletedAt" IS NULL
         GROUP BY 1
       ),
       deals AS (
         SELECT o."companyId" AS company_id,
           count(*)::int AS deal_count,
           COALESCE(sum(o."amountAmountMicros"), 0)::float8 AS deal_value
         FROM ${quotedSchema}.opportunity o
         WHERE o."deletedAt" IS NULL AND o."companyId" IS NOT NULL
         GROUP BY o."companyId"
       )
       SELECT c.id,
         c.name,
         NULLIF(c."domainNamePrimaryLinkUrl", '') AS domain,
         ${leadStatusColumn} AS "leadStatus",
         c."accountOwnerId" AS "ownerId",
         c."createdAt" AS "createdAt",
         COALESCE(people.contact_count, 0) AS "contactCount",
         people.primary_contact AS "primaryContact",
         notes.last_activity AS "lastActivityAt",
         notes.last_title AS "lastActivityTitle",
         notes.last_call AS "lastCallAt",
         COALESCE(notes.call_count, 0) AS "callCount",
         tasks.next_task AS "nextTaskAt",
         COALESCE(tasks.open_tasks, 0) AS "openTaskCount",
         COALESCE(deals.deal_count, 0) AS "dealCount",
         COALESCE(deals.deal_value, 0) AS "dealValueMicros"
       FROM ${quotedSchema}.company c
       LEFT JOIN people ON people.company_id = c.id
       LEFT JOIN notes ON notes.company_id = c.id
       LEFT JOIN tasks ON tasks.company_id = c.id
       LEFT JOIN deals ON deals.company_id = c.id
       WHERE c."deletedAt" IS NULL
       ORDER BY COALESCE(notes.last_activity, c."createdAt") DESC
       LIMIT 5000`,
      [CALL_TITLE_PATTERN, IMPORT_SUMMARY_TITLE],
    );

    return rows;
  }
}
