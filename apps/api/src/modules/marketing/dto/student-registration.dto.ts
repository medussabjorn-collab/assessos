import { IsDateString, IsEmail, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { StudentGender } from '@prisma/client';

// Kept in sync with the 18 industry slugs in assessos-web/lib/industries.tsx
// — free text validated here rather than duplicating the list as a second
// Prisma enum, since the frontend list is the source of truth.
const INDUSTRY_SLUGS = [
  'technology-saas',
  'financial-services',
  'healthcare',
  'legal',
  'manufacturing',
  'retail-ecommerce',
  'bpo-support',
  'insurance',
  'energy-utilities',
  'telecommunications',
  'media-entertainment',
  'education',
  'government-public-sector',
  'real-estate-construction',
  'transportation-logistics',
  'hospitality-travel',
  'pharma-life-sciences',
  'professional-services',
];

export class StudentRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName: string;

  @IsEmail()
  @MaxLength(320)
  email: string;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  studentId: string;

  @IsEnum(StudentGender)
  gender: StudentGender;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  universityName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  collegeName?: string;

  @IsIn(INDUSTRY_SLUGS)
  industry: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  course: string;

  // Honeypot — see ContactLeadDto for the same reasoning.
  @IsOptional()
  @IsString()
  _gotcha?: string;
}
