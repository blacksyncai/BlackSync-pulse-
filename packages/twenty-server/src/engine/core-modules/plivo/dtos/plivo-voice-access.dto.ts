import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('PlivoVoiceAccess')
export class PlivoVoiceAccessDTO {
  @Field(() => Boolean)
  isEnabled: boolean;

  @Field(() => String, { nullable: true })
  accessToken: string | null;
}
