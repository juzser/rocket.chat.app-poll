import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { UIKitBlockInteractionContext, UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { createPollMessage } from './src/lib/createPollMessage';
import { votePoll } from './src/lib/votePoll';
import { createPollModal } from './src/lib/createPollModal';
import { getPoll } from './src/lib/getPoll';
import { finishPollMessage } from './src/lib/finishPollMessage';
import { PollCommand } from './src/PollCommand';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';

export class PollrApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        const data = context.getInteractionData();

        const { state }: {
            state: {
                poll: {
                    question: string,
                    [option: string]: string,
                },
                config?: {
                    mode?: string,
                    visibility?: string,
                },
            },
        } = data.view as any;

        if (!state) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: {
                    question: 'Error creating poll',
                },
            });
        }

        try {
            await createPollMessage(this, data, read, modify, persistence, data.user.id);
        } catch (err) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: err,
            });
        }

        return {
            success: true,
        };
    }

    public async executeBlockActionHandler(context: UIKitBlockInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify) {
        const data = context.getInteractionData();

        this.getLogger().log('executeBlockActionHandler', data);

        this.getLogger().log('executeBlockActionHandler', data.actionId);

        switch (data.actionId) {
            case 'vote': {
                await votePoll({ app: this, data, read, persistence, modify });

                return {
                    success: true,
                };
            }

            case 'create': {
                const modal = await createPollModal({ app: this, data, persistence, modify });

                return context.getInteractionResponder().openModalViewResponse(modal);
            }

            case 'addChoice': {
                const modal = await createPollModal({ app: this, id: data.container.id, data, persistence, modify, options: parseInt(String(data.value), 10) });

                return context.getInteractionResponder().updateModalViewResponse(modal);
            }

            case 'extraOptions': {
                if (data.value === 'duplicate') {
                    try {
                        const msgId = data.message ? data.message.id : '';
                        const pollData = await getPoll(String(msgId), read);

                        const modal = await createPollModal({
                            app: this,
                            question: pollData.question,
                            data,
                            persistence,
                            modify,
                            options: pollData.options.length,
                            pollData,
                        });
                        return context.getInteractionResponder().openModalViewResponse(modal);
                    } catch (e) {
                        const { room } = context.getInteractionData();
                        const errorMessage = modify
                             .getCreator()
                             .startMessage()
                             .setSender(context.getInteractionData().user)
                             .setText(e.message)
                             .setUsernameAlias('Poll');

                        if (room) {
                                errorMessage.setRoom(room);
                        }
                        modify
                             .getNotifier()
                             .notifyUser(
                                 context.getInteractionData().user,
                                 errorMessage.getMessage(),
                             );
                    }
                }

                if (data.value === 'finish') {
                    try {
                        await finishPollMessage({ app: this, data, read, persistence, modify });
                    } catch (e) {
                        const { room } = context.getInteractionData();
                        const errorMessage = modify
                             .getCreator()
                             .startMessage()
                             .setSender(context.getInteractionData().user)
                             .setText(e.message)
                             .setUsernameAlias('Poll');

                        if (room) {
                                errorMessage.setRoom(room);
                        }
                        modify
                             .getNotifier()
                             .notifyUser(
                                 context.getInteractionData().user,
                                 errorMessage.getMessage(),
                             );
                    }
                }
            }

        }

        return {
            success: true,
            triggerId: data.triggerId,
        };
    }

    public async initialize(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new PollCommand(this));
        await configuration.settings.provideSetting({
            id : 'use-user-name',
            i18nLabel: 'Use name attribute to display voters, instead of username',
            i18nDescription: 'When checked, display voters as full user names instead of username',
            required: false,
            type: SettingType.BOOLEAN,
            public: true,
            packageValue: false,
        });
    }
}
