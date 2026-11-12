import { readingService as defaultReadingService } from './reading.service.js';

/**
 * Controller handling HTTP requests for blood glucose readings.
 */
export class ReadingController {
  /**
   * @param {import('./reading.service.js').ReadingService} [readingService]
   */
  constructor(readingService = defaultReadingService) {
    this.readingService = readingService;
  }

  /**
   * Records a new reading.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  createReading = async (req, res) => {
    // Security Rule 1: userId ALWAYS from req.user.id
    const userId = req.user.id;
    const payload = req.validated;
    const reading = await this.readingService.createReading(userId, payload);
    return res.status(201).json(reading);
  };

  /**
   * Lists paginated readings for the authenticated user.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getReadings = async (req, res) => {
    const userId = req.user.id;
    const query = req.validated?.query || req.validated || {};
    const result = await this.readingService.getReadings(userId, query);
    return res.status(200).json(result);
  };

  /**
   * Updates an existing reading.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  updateReading = async (req, res) => {
    const userId = req.user.id;
    const readingId = req.params.id;
    const payload = req.validated;
    const updated = await this.readingService.updateReading(userId, readingId, payload);
    return res.status(200).json(updated);
  };

  /**
   * Deletes a reading.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  deleteReading = async (req, res) => {
    const userId = req.user.id;
    const readingId = req.params.id;
    await this.readingService.deleteReading(userId, readingId);
    return res.status(204).send();
  };
}

export const readingController = new ReadingController();
