import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class SamlService {
  constructor(
    private config: ConfigService,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  getSamlConfig() {
    return {
      enabled: !!this.config.get("SAML_ENTRY_POINT"),
      entryPoint: this.config.get("SAML_ENTRY_POINT") || null,
      issuer: this.config.get("SAML_ISSUER") || "ponylab",
      callbackUrl:
        this.config.get("SAML_CALLBACK_URL") || "/api/auth/saml/callback",
    };
  }

  async handleSamlCallback(profile: {
    email: string;
    firstName?: string;
    lastName?: string;
    nameId?: string;
  }) {
    // Find or create user from SAML profile
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // Auto-provision user from SAML
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName || profile.email.split("@")[0],
          lastName: profile.lastName || "",
          passwordHash: "", // SSO users don't need a password
          isActive: true,
        },
      });
    }

    // Generate JWT tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      userId: user.id,
    };
  }

  getMetadataXml() {
    const issuer = this.config.get("SAML_ISSUER") || "ponylab";
    const callbackUrl =
      this.config.get("SAML_CALLBACK_URL") || "/api/auth/saml/callback";
    return `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${issuer}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${callbackUrl}" index="1"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
  }
}
