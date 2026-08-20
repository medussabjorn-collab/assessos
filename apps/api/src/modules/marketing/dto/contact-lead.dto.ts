import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// Kept in sync with TEAM_SIZES in assessos-web/components/ContactForm.tsx —
// free text validated here rather than a Prisma enum, since the source of
// truth for this list lives in the frontend and an enum would need a
// migration every time it changes.
const TEAM_SIZES = ['1–50', '51–200', '201–1,000', '1,000–5,000', '5,000+'];

export class ContactLeadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  company: string;

  @IsOptional()
  @IsIn(TEAM_SIZES)
  teamSize?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  // Honeypot — real users never populate this. Whitelisted (not rejected by
  // forbidNonWhitelisted) so a populated value reaches the service, which
  // silently discards the submission instead of writing it.
  @IsOptional()
  @IsString()
  _gotcha?: string;
}
