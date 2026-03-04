import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTeamDto {
  @ApiProperty({ example: "Biochemistry Lab" })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: "Research team for protein analysis", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
