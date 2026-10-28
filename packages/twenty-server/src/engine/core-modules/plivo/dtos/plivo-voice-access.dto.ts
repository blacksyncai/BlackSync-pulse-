import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('PlivoCallerId')
export class PlivoCallerIdDTO {
  @Field(() => String)
  number: string;

  @Field(() => String, { nullable: true })
  label: string | null;
}

@ObjectType('PlivoVoiceAccess')
export class PlivoVoiceAccessDTO {
  @Field(() => Boolean)
  isEnabled: boolean;

  @Field(() => String, { nullable: true })
  accessToken: string | null;

  @Field(() => [PlivoCallerIdDTO])
  callerIds: PlivoCallerIdDTO[];

  @Field(() => String, { nullable: true })
  defaultCallerId: string | null;
}
