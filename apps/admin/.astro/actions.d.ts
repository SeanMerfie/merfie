declare module "astro:actions" {
	type Actions = typeof import("D:/merfie/apps/admin/src/actions/index.ts")["server"];

	export const actions: Actions;
}