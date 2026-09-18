import { Type } from '@angular/core';
import { Route } from '@angular/router';

import { AppInfoPage } from '../pages/app-info/app-info.page';
import { ContactPage } from '../pages/contact/contact.page';
import { routes } from '../app.routes';

describe('auxiliary application routes', () => {
  it('should load distinct About and Contact components', async () => {
    const aboutRoute = routeFor('app-info');
    const contactRoute = routeFor('contact');

    const aboutComponent = await loadComponent(aboutRoute);
    const contactComponent = await loadComponent(contactRoute);

    expect(aboutComponent).toBe(AppInfoPage);
    expect(contactComponent).toBe(ContactPage);
    expect(contactComponent).not.toBe(aboutComponent);
  });
});

function routeFor(path: string): Route {
  const route = routes.find((candidate) => candidate.path === path);
  if (route === undefined) {
    throw new Error(`Missing route: ${path}`);
  }
  return route;
}

async function loadComponent(route: Route): Promise<Type<unknown>> {
  if (typeof route.loadComponent !== 'function') {
    throw new Error(`Route ${route.path} has no lazy component loader.`);
  }
  return await route.loadComponent() as Type<unknown>;
}
