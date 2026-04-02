import type { ReactNode } from 'react';

export type Route = {
  path: string;
  component: React.ComponentType;
  /**
   * does this route require authentication?
   */
  authentication?: boolean;
  /**
   * should the route match exactly?
   */
  exact?: boolean;
};

export interface AppViewOptions {
  /**
   * app routes when you want addition routes
   */
  routes: Route[];
  /**
   * render addition element in app header below announcement
   */
  headers?: ReactNode;
}
