import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { SamlService } from "./saml.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private samlService: SamlService,
  ) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard("local"))
  @ApiOperation({ summary: "Login with email and password" })
  async login(@CurrentUser() user: any, @Body() _dto: LoginDto) {
    return this.authService.login(user.id, user.email, user.role);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get("saml/config")
  @ApiOperation({ summary: "Get SAML SSO configuration" })
  async getSamlConfig() {
    return this.samlService.getSamlConfig();
  }

  @Get("saml/login")
  @ApiOperation({ summary: "Redirect to SAML IdP login" })
  async samlLogin(@Res() res: Response) {
    const config = this.samlService.getSamlConfig();
    if (!config.enabled) {
      return res.status(400).json({ message: "SAML SSO is not configured" });
    }
    return res.redirect(config.entryPoint!);
  }

  @Post("saml/callback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Handle SAML IdP callback" })
  async samlCallback(@Body() body: any) {
    // In a real implementation, this would validate the SAML assertion
    // For now, it demonstrates the flow
    if (!body.email) {
      throw new UnauthorizedException("Invalid SAML response: missing email");
    }
    return this.samlService.handleSamlCallback({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
    });
  }

  @Get("saml/metadata")
  @ApiOperation({ summary: "Get SAML Service Provider metadata" })
  async samlMetadata(@Res() res: Response) {
    const xml = this.samlService.getMetadataXml();
    res.set("Content-Type", "application/xml");
    res.send(xml);
  }
}
