export enum ImagePath {
  TESTAMENTS = 'testaments',
  USERS = 'users',
  ECOMMERCE = 'e-commerce',
  PROFILE = 'profile',
  BLOG = 'blog'
}

// ==============================|| NEW URL - GET IMAGE URL ||============================== //

export function getImageUrl(name: string, path: string) {
  return new URL(`/src/assets/images/${path}/${name}`, import.meta.url).href;
}
