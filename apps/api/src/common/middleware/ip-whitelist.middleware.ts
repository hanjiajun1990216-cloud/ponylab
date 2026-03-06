import { Injectable, NestMiddleware, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class IpWhitelistMiddleware implements NestMiddleware {
  private allowedCidrs: string[];

  constructor(private config: ConfigService) {
    const whitelist = this.config.get<string>("IP_WHITELIST") || "";
    this.allowedCidrs = whitelist
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  use(req: Request, _res: Response, next: NextFunction) {
    // If no whitelist configured, allow all
    if (this.allowedCidrs.length === 0) {
      return next();
    }

    const clientIp = req.ip || req.socket.remoteAddress || "";

    // Always allow localhost
    if (
      clientIp === "127.0.0.1" ||
      clientIp === "::1" ||
      clientIp === "::ffff:127.0.0.1"
    ) {
      return next();
    }

    const isAllowed = this.allowedCidrs.some((cidr: string) =>
      this.matchCidr(clientIp, cidr),
    );

    if (!isAllowed) {
      throw new ForbiddenException("Access denied: IP not in whitelist");
    }

    next();
  }

  private matchCidr(ip: string, cidr: string): boolean {
    // Simple CIDR matching
    if (!cidr.includes("/")) {
      return ip === cidr || ip === `::ffff:${cidr}`;
    }

    const [network, bits] = cidr.split("/");
    const mask = parseInt(bits, 10);

    // Normalize IPv4-mapped IPv6
    const normalizedIp = ip.replace("::ffff:", "");
    const normalizedNetwork = network.replace("::ffff:", "");

    const ipNum = this.ipToNumber(normalizedIp);
    const netNum = this.ipToNumber(normalizedNetwork);
    const maskNum = ~(2 ** (32 - mask) - 1);

    return (ipNum & maskNum) === (netNum & maskNum);
  }

  private ipToNumber(ip: string): number {
    const parts = ip.split(".");
    if (parts.length !== 4) return 0;
    return parts.reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
  }
}
