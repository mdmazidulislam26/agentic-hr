import { IsBoolean, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateCutoffDto {
  @IsBoolean()
  useAiRecommendation: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  customPercentage?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  customTopCount?: number;
}
