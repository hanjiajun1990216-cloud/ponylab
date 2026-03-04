import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateExperimentDto {
  @ApiProperty({ example: "Protein Expression Optimization" })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  content?: any;

  @ApiProperty()
  @IsString()
  projectId: string;
}
