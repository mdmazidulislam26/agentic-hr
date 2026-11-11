import { 
  IsString, 
  IsNotEmpty, 
  IsDateString, 
  IsBoolean, 
  IsOptional, 
  IsNumber, 
  Min, 
  Max, 
  IsArray, 
  IsEnum 
} from 'class-validator';
import { DifficultyLevel } from '@prisma/client';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsString()
  @IsNotEmpty()
  jobDescription: string;

  @IsString()
  @IsNotEmpty()
  requirements: string;

  @IsDateString()
  @IsNotEmpty()
  deadline: string;

  @IsNumber()
  @Min(50)
  @Max(90)
  minAtsScoreThreshold: number = 75.0;

  @IsBoolean()
  hasAttitudeRound: boolean = false;

  @IsBoolean()
  @IsOptional()
  skipAssessmentAtStart: boolean = false;

  @IsArray()
  @IsOptional()
  assessmentTopics?: string[];

  @IsNumber()
  @IsOptional()
  totalAssessmentQuestions?: number;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  assessmentDifficulty?: DifficultyLevel;

  @IsNumber()
  @IsOptional()
  slotDurationMinutes: number = 15;
}
