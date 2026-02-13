declare module "astro:actions" {
	type Actions = typeof import("/var/www/merfie/apps/admin/src/actions/index.ts")["server"];

	export const actions: Actions;
}