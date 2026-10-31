import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class IngestPulseCallDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  source: string;
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  externalId: string;
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phoneNumber: string;
  @IsIn(['inbound', 'outbound'])
  direction: 'inbound' | 'outbound';
  @IsInt()
  @Min(0)
  @Max(604800)
  durationSeconds: number;
  @IsIn(['answered', 'no-answer', 'busy', 'failed', 'voicemail', 'canceled'])
  outcome: string;
  @IsOptional()
  @IsUUID()
  personId?: string;
  @IsOptional()
  @IsUUID()
  companyId?: string;
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  summary?: string;
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  transcript?: string;
  @IsOptional()
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
    require_valid_protocol: true,
  })
  @MaxLength(2048)
  @Matches(/^https:\/\/[^\s)]+$/)
  recordingUrl?: string;
}
