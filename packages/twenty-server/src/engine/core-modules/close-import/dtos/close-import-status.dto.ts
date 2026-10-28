import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('CloseImportCounts')
export class CloseImportCountsDTO {
  @Field(() => Int)
  companies: number;

  @Field(() => Int)
  people: number;

  @Field(() => Int)
  opportunities: number;

  @Field(() => Int)
  notes: number;

  @Field(() => Int)
  calls: number;

  @Field(() => Int)
  emails: number;

  @Field(() => Int)
  texts: number;

  @Field(() => Int)
  tasks: number;
}

@ObjectType('CloseImportStatus')
export class CloseImportStatusDTO {
  @Field(() => String)
  state: string;

  @Field(() => String, { nullable: true })
  organizationName: string | null;

  @Field(() => String, { nullable: true })
  currentStep: string | null;

  @Field(() => CloseImportCountsDTO)
  counts: CloseImportCountsDTO;

  @Field(() => String, { nullable: true })
  error: string | null;

  @Field(() => String, { nullable: true })
  startedAt: string | null;

  @Field(() => String, { nullable: true })
  finishedAt: string | null;
}
