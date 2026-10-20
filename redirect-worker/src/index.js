// Permanent redirect: mohsin.se/cambridge-site/<path> -> mohsin.se/cambridge/<path>
export default {
	fetch(request) {
		const url = new URL(request.url);
		url.pathname = url.pathname.replace(/^\/cambridge-site(?=\/|$)/, "/cambridge");
		return Response.redirect(url.toString(), 301);
	},
};
