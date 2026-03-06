import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  async getProfile(@CurrentUser("id") userId: string) {
    return this.userService.getProfile(userId);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user profile" })
  async updateProfile(
    @CurrentUser("id") userId: string,
    @Body() body: { firstName?: string; lastName?: string; avatar?: string },
  ) {
    return this.userService.updateProfile(userId, body);
  }

  @Get()
  @ApiOperation({ summary: "List all users" })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.userService.findAll(page, Math.min(limit, 100));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  async findById(@Param("id") id: string) {
    return this.userService.findById(id);
  }
}
