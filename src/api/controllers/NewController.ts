import BaseController from './BaseController';
import App from '../structures/App';
import { Request, Response } from 'express';
import NewHandler from '../../bot/structures/NewHandler';

export default class NewController extends BaseController {
	public client;
	public newHandler;

	public constructor(app: App) {
		super('/new', app);

		this.client = app.client;
		this.newHandler = app.client.newHandler;
	}

	public init(): void {
		this.router.get('/start', this._handleNewAuthorize.bind(this));
		this.router.get('/callback', this._callback.bind(this));
	}

	private async _callback(req: Request, res: Response): Promise<Response | void> {
		this.app.client.logger.verbose(`[CALLBACK URL]: ${req.url}`);
		const sessionQuery = req.query.session?.toString();
		const session = this.newHandler.sessions.get(sessionQuery ?? '');
		if (!session) return res.send('Invalid session provided.');

		const accessToken = await this.newHandler.fetchAccessToken(session.token, req.query.oauth_verifier!.toString());
		if (typeof accessToken === 'string') {
			this.app.app.emit(`error_${sessionQuery}`, accessToken);
			return res.send(`Something didn't turn out correctly...\n Error: ${accessToken}`);
		}

		this.app.app.emit(
			`internally_authenticated_${sessionQuery}`,
			accessToken.oauth_token,
			accessToken.oauth_token_secret,
		);
		return res.redirect('https://thumbs.gfycat.com/HairyTartEarthworm-size_restricted.gif');
	}

	private async _handleNewAuthorize(req: Request, res: Response): Promise<Response | void> {
		const sessionQuery: string = req.query.session!.toString();
		if (!sessionQuery) return res.send('Invalid session query parameter.');

		const requestToken = await this.newHandler.fetchRequestToken(sessionQuery);

		this.newHandler.sessions.set(sessionQuery, {
			token: requestToken.oauth_token,
			secret: requestToken.oauth_token_secret,
		});

		return res.redirect(`https://twitter.com/oauth/authorize?oauth_token=${requestToken.oauth_token}`);
	}
}
