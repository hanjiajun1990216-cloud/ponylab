import { IsString, IsOptional, IsBoolean, MinLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateExperimentTemplateDto {
  @ApiPropertyOptional({ description: "模板名称" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ description: "模板描述" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "模板内容（JSON 结构）" })
  @IsOptional()
  content?: any;

  @ApiPropertyOptional({ description: "分类标签" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: "是否公开" })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
