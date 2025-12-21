import { IsArray, IsEnum, IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ExportFormat } from '../interfaces/report.interface';

export class GenerateReportDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsArray()
  @IsOptional()
  columns?: string[];

  @IsObject()
  @IsOptional()
  filters?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  groupBy?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @IsIn(['excel', 'csv', 'pdf', 'json'])
  @IsOptional()
  format?: string;
}
