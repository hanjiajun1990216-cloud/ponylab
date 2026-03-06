import { Controller, Post, Param, Body, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AIService } from "./ai.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("AI")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("ai")
export class AIController {
  constructor(private aiService: AIService) {}

  @Post("experiment/:id/chat")
  async chat(
    @Param("id") id: string,
    @Body() body: { message: string },
    @CurrentUser("id") userId: string,
  ) {
    return this.aiService.chat(id, body.message, userId);
  }

  @Post("protocol/parse")
  async parseProtocol(@Body() body: { text: string }) {
    return this.aiService.parseProtocol(body.text);
  }

  @Post("experiment/:id/anomaly")
  async detectAnomalies(@Param("id") id: string) {
    return this.aiService.detectAnomalies(id);
  }

  @Post("inventory/:id/forecast")
  async forecastInventory(@Param("id") id: string) {
    return this.aiService.forecastInventory(id);
  }
}
