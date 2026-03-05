import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { FileService } from "./file.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Files")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("files")
export class FileController {
  constructor(private fileService: FileService) {}

  @Post()
  @ApiOperation({ summary: "Register uploaded file" })
  async create(
    @Body()
    body: {
      originalName: string;
      mimeType: string;
      size: number;
      experimentId?: string;
      resultId?: string;
    },
    @CurrentUser("id") userId: string,
  ) {
    return this.fileService.create(body, userId);
  }

  @Get("experiment/:experimentId")
  @ApiOperation({ summary: "List files for experiment" })
  async findByExperiment(@Param("experimentId") experimentId: string) {
    return this.fileService.findByExperiment(experimentId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get file metadata" })
  async findById(@Param("id") id: string) {
    return this.fileService.findById(id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete file" })
  async delete(@Param("id") id: string) {
    return this.fileService.delete(id);
  }
}
