import { quotaService } from '../services/quota.service';
import type { AuthContext } from './auth.middleware';

export const quotaMiddleware = async (context: AuthContext) => {
  if (!context.user) {
    context.set.status = 401;
    return {
      success: false,
      message: 'Unauthorized',
    };
  }

  const canUpload = await quotaService.canUpload(context.user.userId);

  if (!canUpload.allowed) {
    context.set.status = 403;
    return {
      success: false,
      message: canUpload.message,
    };
  }
};