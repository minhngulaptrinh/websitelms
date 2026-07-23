import { getCurrentUser, homeRouteFor } from './auth.js';
import { setGlobalLoading, toast, friendlyError } from './ui.js';

const routes = [];

export function addRoute(pattern, view, roles) {
  const paramNames = [];
  const regex = new RegExp(
    '^' +
      pattern.replace(/:[^/]+/g, (match) => {
        paramNames.push(match.slice(1));
        return '([^/]+)';
      }) +
      '$'
  );
  routes.push({ regex, paramNames, view, roles });
}

function parseHash() {
  let hash = (window.location.hash || '#/home').split('?')[0];
  if (hash === '#' || hash === '#/') hash = '#/home';
  return hash;
}

async function resolve() {
  const path = parseHash();
  const user = getCurrentUser();

  const match = routes.find((r) => r.regex.test(path));

  if (!match) {
    window.location.hash = user ? homeRouteFor(user.role) : '#/home';
    return;
  }

  const isPublic = !match.roles;

  if (path === '#/login' && user) {
    window.location.hash = homeRouteFor(user.role);
    return;
  }

  if (!isPublic && !user) {
    window.location.hash = '#/login';
    return;
  }

  if (match.roles && !match.roles.includes(user.role)) {
    window.location.hash = homeRouteFor(user.role);
    return;
  }

  const values = path.match(match.regex).slice(1);
  const params = {};
  match.paramNames.forEach((name, i) => {
    params[name] = decodeURIComponent(values[i]);
  });

  try {
    await match.view(params);
  } catch (error) {
    setGlobalLoading(false);
    toast(friendlyError(error), 'error');
  }
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}

export function navigate(hash) {
  if (window.location.hash === hash) {
    resolve();
  } else {
    window.location.hash = hash;
  }
}
