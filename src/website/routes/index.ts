import { setupAPI } from './api';
import { setupAuth } from './auth';
import { setupOnboarding } from './onboarding';
import { setupStripe } from './stripe';
import { setupUserRoutes } from './user';

export { setupAPI, setupAuth, setupStripe, setupUserRoutes, setupOnboarding };
export default [setupAPI, setupAuth, setupStripe, setupUserRoutes, setupOnboarding];
