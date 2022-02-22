import bodyparser from 'body-parser';
import express, { Application, Response, Request } from 'express';
import helmet from 'helmet';
import Controllers from '../controllers';
import SuccessClient from '../../bot/client';

interface AppOptions {
	port: number;
}

export default class App {
	public readonly app: Application = express();
	public readonly client: SuccessClient;
	public readonly options: AppOptions;

	public constructor(client: SuccessClient, options: AppOptions) {
		this.client = client;
		this.options = options;
	}

	private _initMiddlewares(): Application {
		this.app
			.use(bodyparser.json())
			.use(bodyparser.urlencoded({ extended: true }))
			.use(helmet())
			.set('port', this.options.port);

		return this.app;
	}

	private _initControllers(): void {
		for (const Route of Controllers) {
			const controller = new Route(this);
			this.app.use(controller.path, controller.router);
		}
	}

	public init(): void {
		this._initMiddlewares();
		this._initControllers();
		this.app.get('/metrics', async (_: Request, res: Response) => {
			res.setHeader('Content-Type', this.client.metrics.registry.contentType);
			const metrics = await this.client.metrics.registry.metrics();
			return res.send(metrics);
		});

		this.app.listen(this.options.port, () => {
			this.client.logger.verbose(`[SERVER] Server live on port ${this.options.port}.`);
		});
	}
}
