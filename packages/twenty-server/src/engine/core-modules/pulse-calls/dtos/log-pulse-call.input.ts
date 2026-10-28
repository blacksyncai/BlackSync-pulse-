import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class LogPulseCallInput {
  @Field(() => String)
  phoneNumber: string;

  @Field(() => Int)
  durationSeconds: number;

  @Field(() => String)
  outcome: string;

  @Field(() => String, { nullable: true })
  callUuid?: string | null;

  @Field(() => String, { nullable: true })
  personId?: string | null;

  @Field(() => String, { nullable: true })
  companyId?: string | null;

  @Field(() => Boolean)
  isRecorded: boolean;
}
