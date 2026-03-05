import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { CommentService } from "./comment.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PermissionGuard } from "../../common/guards/permission.guard";

@ApiTags("Comments")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), PermissionGuard)
@Controller("comments")
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: "List comments by project, task, or instrument" })
  async findMany(
    @Query("projectId") projectId?: string,
    @Query("taskId") taskId?: string,
    @Query("instrumentId") instrumentId?: string,
  ) {
    return this.commentService.findMany({ projectId, taskId, instrumentId });
  }

  @Post()
  @ApiOperation({ summary: "Create a comment" })
  async create(
    @Body()
    body: {
      content: string;
      projectId?: string;
      taskId?: string;
      instrumentId?: string;
      label?: string;
    },
    @CurrentUser("id") userId: string,
  ) {
    return this.commentService.create(userId, body);
  }

  @Post(":id/replies")
  @ApiOperation({ summary: "Reply to a comment" })
  async reply(
    @Param("id") id: string,
    @Body() body: { content: string },
    @CurrentUser("id") userId: string,
  ) {
    return this.commentService.reply(id, userId, body.content);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update comment (pin, label, content)" })
  async update(
    @Param("id") id: string,
    @Body() body: { isPinned?: boolean; label?: string; content?: string },
  ) {
    return this.commentService.update(id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a comment" })
  async delete(@Param("id") id: string) {
    return this.commentService.delete(id);
  }
}
