import { Client, KlasaClientOptions, util } from 'klasa';
import { OPTIONS } from './util/CONSTANTS';
import { join } from 'path';

Client.defaultGuildSchema
	.add('minStars', 'integer', { default: 3 })
	.add('starChannel', 'TextChannel')
	.add('starredMessages', 'any', { array: true })

export class StarboardClient extends Client {
	constructor(options?: KlasaClientOptions) {
		super(options)
		// @ts-ignore
		this.constructor[Client.plugin].call(this);
	}

	static [Client.plugin]() {
		const typedThis = this as unknown as StarboardClient;
		util.mergeDefault(OPTIONS, typedThis.options);

		const coreDirectory = join(__dirname, '..', '/');


		// @ts-ignore
		typedThis.events.registerCoreDirectory(coreDirectory);
	}
}