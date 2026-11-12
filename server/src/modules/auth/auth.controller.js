import { authService as defaultAuthService } from './auth.service.js';
import { setAuthCookie, setRefreshTokenCookie, clearAuthCookie } from '../../common/utils/cookies.js';
import { verifyToken } from './token.service.js';

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
   * Registers a new patient account and sets the session cookies.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  register = async (req, res) => {
    const { name, email, password } = req.validated;
    const { user, token, refreshToken } = await this.authService.register({ name, email, password });

    setAuthCookie(res, token);
    if (refreshToken) {
      setRefreshTokenCookie(res, refreshToken);
    }
    return res.status(201).json(user);
  };

  /**
   * Logs in an existing user and sets the session cookies.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  login = async (req, res) => {
    const { email, password } = req.validated;
    const { user, token, refreshToken } = await this.authService.login({ email, password });

    setAuthCookie(res, token);
    if (refreshToken) {
      setRefreshTokenCookie(res, refreshToken);
    }
    return res.status(200).json(user);
  };

  /**
   * Rotates an existing refresh token and issues a new access/refresh token pair.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  refresh = async (req, res) => {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    const { user, token, refreshToken: newRefreshToken } = await this.authService.rotateToken(rawRefreshToken);

    setAuthCookie(res, token);
    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json({
      user,
      message: 'Token rotated successfully',
    });
  };

  /**
   * Logs out the user by clearing the JWT session cookies and revoking refresh token.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  logout = async (req, res) => {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (rawRefreshToken) {
      try {
        const decoded = verifyToken(rawRefreshToken);
        if (decoded?.id && decoded?.jti) {
          await this.authService.logout(decoded.id, decoded.jti);
        }
      } catch {
        // Ignore token decode errors on logout
      }
    }

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
