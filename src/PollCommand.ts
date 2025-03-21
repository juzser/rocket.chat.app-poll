import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { createPollModal } from './lib/createPollModal';
import { PollrApp as AppClass } from '../PollrApp';

export class PollCommand implements ISlashCommand {
    public command = 'pollr';
    public i18nParamsExample = 'params_example';
    public i18nDescription = 'cmd_description';
    public providesPreview = false;

    constructor(private readonly app: AppClass) {}

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
        const triggerId = context.getTriggerId();

        const question = context.getArguments().join(' ');

        if (triggerId) {
            const modal = await createPollModal({ app: this.app, question, persistence: persis, modify, data: { room: (context.getRoom() as any).value } });

            await modify.getUiController().openSurfaceView(modal, { triggerId }, context.getSender());
        }
    }
}
