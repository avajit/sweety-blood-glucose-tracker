import { authService as defaultAuthService } from './auth.service.js';
import { setAuthCookie, clearAuthCookie } from '../../common/utils/cookies.js';

/**
 * Controller handling HTTP requests for authentication and user identity.
 */
export class AuthController {
  /**
   * @param {import('./auth.service.js').AuthService} [authService]
   */
  constructor(authService = defaultAuthService) {
    this.authService = authService;
  }

  /**
   * Registers a new patient account and sets the JWT session cookie.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  register = async (req, res) => {
    const { name, email, password } = req.validated;
    const { user, token } = await this.authService.register({ name, email, password });

    setAuthCookie(res, token);
    return res.status(201).json(user);
  };

  /**
   * Logs in an existing user and sets the JWT session cookie.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  login = async (req, res) => {
    const { email, password } = req.validated;
    const { user, token } = await this.authService.login({ email, password });

    setAuthCookie(res, token);
    return res.status(200).json(user);
  };

  /**
   * Logs out the user by clearing the JWT session cookie.
   * @param {import('express').Request} _req
   * @param {import('express').Response} res
   */
  logout = (_req, res) => {
    clearAuthCookie(res);
    return res.status(200).json({ message: 'Logged out' });
  };

  /**
   * Retrieves profile of current authenticated user from req.user.id.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMe = async (req, res) => {
    // Hard Security Rule: userId is ALWAYS read from req.user.id
    const user = await this.authService.getMe(req.user.id);
    return res.status(200).json(user);
  };
}

export const authController = new AuthController();
