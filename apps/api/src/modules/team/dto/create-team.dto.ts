import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

enum TeamVisibility {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  PRIVATE = "PRIVATE",
}

export class CreateTeamDto {
  @ApiProperty({ example: "Biochemistry Lab" })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    example: "Research team for protein analysis",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    enum: TeamVisibility,
    default: TeamVisibility.CLOSED,
    required: false,
  })
  @IsOptional()
  @IsEnum(TeamVisibility)
  visibility?: TeamVisibility;
}
