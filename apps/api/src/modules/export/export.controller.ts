import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { ExportService } from "./export.service";

@ApiTags("Export")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("export")
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get("experiments")
  @ApiOperation({ summary: "Export experiments as CSV" })
  async exportExperiments(
    @Query("projectId") projectId: string,
    @Res() res: Response,
  ) {
    const rows = await this.exportService.exportExperiments(projectId);
    const csv = this.exportService.toCsv(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=experiments.csv",
    );
    res.send("\uFEFF" + csv); // BOM for Excel UTF-8
  }

  @Get("inventory")
  @ApiOperation({ summary: "Export inventory as CSV" })
  async exportInventory(@Query("teamId") teamId: string, @Res() res: Response) {
    const rows = await this.exportService.exportInventory(teamId);
    const csv = this.exportService.toCsv(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=inventory.csv");
    res.send("\uFEFF" + csv);
  }

  @Get("samples")
  @ApiOperation({ summary: "Export samples as CSV" })
  async exportSamples(
    @Query("projectId") projectId: string,
    @Res() res: Response,
  ) {
    const rows = await this.exportService.exportSamples(projectId);
    const csv = this.exportService.toCsv(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=samples.csv");
    res.send("\uFEFF" + csv);
  }
}
