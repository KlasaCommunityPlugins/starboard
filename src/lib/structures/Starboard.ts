import { KlasaGuild, KlasaMessage, KlasaUser } from "klasa";
import { Collection, GuildChannel, MessageEmbed } from "discord.js";
import { PromiseFunction, Queue } from "./Queue";
import { extname } from 'path';

export class Starboard {
	guild: KlasaGuild;
	queues: Collection<string, Queue> = new Collection();
	reactionsRemoved: Set<any> = new Set();

	constructor(guild: KlasaGuild) {
		this.guild = guild;
	}

	get channel(): GuildChannel | undefined {
		const channelID = this.guild.settings.get('starChannel');
		if (!channelID) throw 'A starboard channel does not exist';
		return this.guild.channels.get(channelID);
	}

	get minimum() {
		return this.guild.settings.get('minStars');
	}

	queue(msg: KlasaMessage, promiseFunc: PromiseFunction) {
		let queue = this.queues.get(msg.id);
		if (!queue) {
			this.queues.set(msg.id, new Queue());
			queue = this.queues.get(msg.id);
		}
		return new Promise(resolve => {
			queue!.add(() => promiseFunc().then(res => {
				if (!queue!.length) this.queues.delete(msg.id);
				resolve(res as undefined);
			}))
		})
	}

	add(msg: KlasaMessage, starredBy: KlasaUser) {
		if (!this.channel) return;

		if (msg.author.id === starredBy.id) return;

		return this.queue(msg, () => this.addStar(msg, starredBy))
	}

	async addStar(msg: KlasaMessage, starredBy: KlasaUser) {
		const star = (this.guild.settings.get('stars') as []).find((starMsg: any) => starMsg.messageID === msg.id);
		const starChannel = this.guild.settings.get('starChannel')
		if (!starChannel) return;
		if (!star) {
			const starboardMessage = this.minimum === 1
				? await starChannel.sendEmbed({ embed: this.buildStarboardEmbed(msg) })
				: null;

		}
	}

	buildStarboardEmbed(msg: KlasaMessage, starCount = 1) {
		const embed = new MessageEmbed()
			.setColor('GOLD')
			.addField('Author', msg.author, true)
			.addField('Channel', msg.channel, true)
			.setThumbnail(msg.author.displayAvatarURL())
			.setTimestamp(msg.createdAt)
			.setFooter(`⭐ ${starCount} | ${msg.id}`)

		if (msg.content) {
			let content = msg.content.substring(0, 1000)
			if (msg.content.length > 1000) content += '...'
			embed.addField('Message', content)
		}

		embed.addField('Message', `[Jump To](${msg.url})`)

		const attachment = Starboard.findAttachment(msg);
		if (attachment) {
			embed.setImage(attachment);
		}

		return embed;
	}

	static findAttachment(msg: KlasaMessage) {
		let attachment;
		const extensions: string[] = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
		const linkRegex: RegExp = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|gif|webp)/;
		const richEmbed = msg.embeds.find(embed => embed.type === 'rich' &&
			embed.image &&
			extensions.includes(extname(embed.image.url)));
		if (richEmbed) {
			attachment = richEmbed.image.url;
		}
		const attach = msg.attachments.find(file => extensions.includes(extname(file.url)))
		if (attach) {
			attachment = attach.url;
		}

		if (!attachment) {
			const linkMatch = msg.content.match(linkRegex);
			if (linkMatch && extensions.includes(extname(linkMatch[0]))) {
				attachment = linkMatch[0];
			}
		}

		return attachment;
	}
}