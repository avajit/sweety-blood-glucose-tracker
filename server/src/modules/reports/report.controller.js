import { reportService as defaultReportService } from './report.service.js';

/**
 * Controller handling clinical reports requests.
 */
export class ReportController {
  /**
   * @param {import('./report.service.js').ReportService} [reportService]
   */
  constructor(reportService = defaultReportService) {
    this.reportService = reportService;
  }

  /**
   * Generates a glucose report.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getReport = async (req, res) => {
    const requestingUser = req.user;
    const type = req.params.type;
    const query = req.validated?.query || req.validated || req.query;

    const report = await this.reportService.getReport(requestingUser, type, query);
    return res.status(200).json(report);
  };
}

export const reportController = new ReportController();
