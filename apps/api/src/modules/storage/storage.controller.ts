import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { StorageService } from "./storage.service";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

@ApiTags("Storage")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionGuard)
@Controller("storage")
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Get("tree")
  @ApiOperation({ summary: "Get full storage hierarchy tree" })
  async getTree() {
    return this.storageService.getTree();
  }

  @Post()
  @RequirePermission("storage:manage")
  @ApiOperation({ summary: "Create a new storage location" })
  async create(
    @Body()
    body: {
      name: string;
      type: string;
      parentId?: string;
      temperature?: number;
      capacity?: number;
    },
  ) {
    return this.storageService.create(body);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get storage location details" })
  async findById(@Param("id") id: string) {
    return this.storageService.findById(id);
  }

  @Get(":id/contents")
  @ApiOperation({ summary: "Get samples stored at this location" })
  async getContents(
    @Param("id") id: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.storageService.getContents(id, page, Math.min(limit, 100));
  }

  @Delete(":id")
  @RequirePermission("storage:manage")
  @ApiOperation({ summary: "Delete a storage location" })
  async delete(@Param("id") id: string) {
    return this.storageService.delete(id);
  }
}
